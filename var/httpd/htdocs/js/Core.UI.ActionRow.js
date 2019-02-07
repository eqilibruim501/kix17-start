// --
// Modified version of the work: Copyright (C) 2006-2019 c.a.p.e. IT GmbH, https://www.cape-it.de
// based on the original work of:
// Copyright (C) 2001-2019 OTRS AG, https://otrs.com/
// --
// This software comes with ABSOLUTELY NO WARRANTY. For details, see
// the enclosed file LICENSE for license information (AGPL). If you
// did not receive this file, see https://www.gnu.org/licenses/agpl.txt.
// --

"use strict";

var Core = Core || {};
Core.UI = Core.UI || {};

/**
 * @namespace Core.UI.ActionRow
 * @memberof Core.UI
 * @author OTRS AG
 * @description
 *      Action row functionality.
 */
Core.UI.ActionRow = (function (TargetNS) {

    /**
     * @private
     * @name TicketElementSelectors
     * @memberof Core.UI.ActionRow
     * @member {Object}
     * @description
     *      The ticket element selectors for the different overviews.
     */
    var TicketElementSelectors = {
            'Small': 'div.Overview table td input[type="checkbox"][name=TicketID]',
            'Medium': 'ul.Overview input[type="checkbox"][name=TicketID]',
            'Large': 'ul.Overview input[type="checkbox"][name=TicketID]'
        },
    /**
     * @private
     * @name TicketView
     * @memberof Core.UI.ActionRow
     * @member {Object}
     * @description
     *      The active ticket view.
     */
        TicketView;

    if (!Core.Debug.CheckDependency('Core.UI.ActionRow', 'Core.JSON', 'JSON API')) {
        return false;
    }
    if (!Core.Debug.CheckDependency('Core.UI.ActionRow', 'Core.Data', 'Data API')) {
        return false;
    }

    /**
     * @private
     * @name SerializeData
     * @memberof Core.UI.ActionRow
     * @function
     * @returns {String} Query string of the data.
     * @param {Object} Data - The data that should be converted.
     * @description
     *      Converts a given hash into a query string.
     */
    function SerializeData(Data) {
        var QueryString = '';
        $.each(Data, function (Key, Value) {
            QueryString += ';' + encodeURIComponent(Key) + '=' + encodeURIComponent(Value);
        });
        return QueryString;
    }

    /**
     * @name AddActions
     * @memberof Core.UI.ActionRow
     * @function
     * @param {jQueryObject} $Element - The element for which the data is stored.
     * @param {String} JSONString - The JSON string which contains the information about the valid actions of the element (generated by Perl module).
     *      Could also be an javascript object directly.
     * @description
     *      This functions adds information about the valid action of an element to the element.
     *      These information are used to generate the action row individually for this element.
     */
    TargetNS.AddActions = function ($Element, JSONString) {
        var Actions;
        // The element of the given ID must exist, JSONString must not be empty
        if (isJQueryObject($Element)) {
            if (typeof JSONString === 'string') {
                Actions = Core.JSON.Parse(JSONString);
            }
            else {
                Actions = JSONString;
            }

            // save action data to the given element
            Core.Data.Set($Element, 'Actions', Actions);
        }
        else {
            Core.Debug.Log('Element does not exist or no valid data structure passed.');
        }
    };

    /**
     * @name UpdateActionRow
     * @memberof Core.UI.ActionRow
     * @function
     * @param {jQueryObject} $ClickedElement - jQueryObject of the clicked element (normally $(this)).
     * @param {jQueryObject} $Checkboxes - jQueryObject of the checkboxes of the different tickets.
     * @param {jQueryObject} $ActionRow - The jQueryObject of the ActionRow wrapper (normally the <ul>-Element).
     * @description
     *      This function is called on click on the checkbox of an ticket element and updates the action row for this element.
     */
    TargetNS.UpdateActionRow = function ($ClickedElement, $Checkboxes, $ActionRow) {
        var TicketActionData,
            ActionRowElement;

        // Check, if one or more items are selected
        $Checkboxes = $Checkboxes.filter(':checked');
        // No checkbox is selected
        if (!$Checkboxes.length) {
            // Remove actions and deactivate bulk action
            $ActionRow
                .find('li').filter(':not(.AlwaysPresent)').remove()
                .end().end()
                .find('#BulkAction').addClass('Inactive');
        }
        // Exactly one checkbox is selected
        else if ($Checkboxes.length === 1 && !$('#SelectAllTickets').is(':checked')) {
            // Update actions and activate bulk action
            $ActionRow.find('#BulkAction').removeClass('Inactive');

            // Find the element which is active (it must not be the clicked element!)
            // and get the data
            TicketActionData = Core.Data.Get($Checkboxes.closest('li, tr'), 'Actions');
            if (typeof TicketActionData !== 'undefined') {
                $.each(TicketActionData, function (Index, Value) {
                    if (Value.HTML) {
                        $(Value.HTML).attr('id', Value.ID).appendTo($ActionRow);
                        ActionRowElement = $ActionRow.find('#' + Value.ID).find('a');
                        if (typeof Value.Target === 'undefined' || Value.Target === "") {
                            ActionRowElement.attr('href', Value.Link);
                        }
                        if (Value.PopupType) {
                            ActionRowElement.bind('click.Popup', function () {
                                Core.UI.Popup.OpenPopup(Value.Link, Value.PopupType);
                                return false;
                            });
                        }
                    }
                });
            }
        }
        // Two ore more checkboxes selected
        else {
            // Remove actions and activate bulk action
            $ActionRow
                .find('li').filter(':not(.AlwaysPresent)').remove()
                .end().end()
                .find('#BulkAction').removeClass('Inactive');
        }
    };

    /**
     * @name Init
     * @memberof Core.UI.ActionRow
     * @function
     * @description
     *      This function initializes the complete ActionRow functionality and binds all click events.
     */
    TargetNS.Init = function () {
        // Get used ticket view mode
        if ($('#TicketOverviewMedium').length) {
            TicketView = 'Medium';
        }
        else if ($('#TicketOverviewLarge').length) {
            TicketView = 'Large';
        }
        else {
            TicketView = 'Small';
        }

        $(TicketElementSelectors[TicketView]).bind('click', function (Event) {
            Event.stopPropagation();
            Core.UI.ActionRow.UpdateActionRow($(this), $(TicketElementSelectors[TicketView]), $('div.OverviewActions ul.Actions'));
        });

        $('#BulkAction a').bind('click', function () {
            var $Element = $(this);

            if ($Element.parent('li').hasClass('Inactive')) {
                return false;
            }
            else {
                var SelectedItems = $('input[name="SelectedItems"]').val().split(','),
                    FormID        = $('#OverviewControl input[name="FormID"]').val();
                if ( SelectedItems.length > 30 ) {
                    Core.UI.ActionRow.InitShowContentDialog(
                        {
                            SelectedItems: SelectedItems,
                            Action: 'AgentTicketBulk',
                            Subaction: 'TicketLocking',
                            FormID: FormID,
                            Title: Core.Config.Get('BulkDialogTitle'),
                            ID: 'BulkActionSettingsDialogContainer',
                            Label: [
                                Core.Config.Get('BulkDialogButtonYes'),
                                Core.Config.Get('BulkDialogButtonNo')
                            ],
                            Content: Core.Config.Get('BulkDialog')
                        }, 'BulkDialog');
                } else {
                    var ItemIDs = '',
                        Data;

                    $.each(SelectedItems, function (index, value) {
                        ItemIDs += value + (SelectedItems.length == (index + 1) ? "" : ",");
                    });

                    Data = {
                            ItemIDs: ItemIDs,
                            Action: 'AgentPaginationAJAXHandler',
                            Subaction: 'UploadContentIDs',
                            CallAction: 'AgentTicketBulk',
                            FormID: FormID,
                    };

                    Core.AJAX.FunctionCall(Core.Config.Get('Baselink'), Data, function(response) {
                        var URL = Core.Config.Get('Baselink') + "Action=AgentTicketBulk;Subaction=TicketLocking;FormID=" + FormID;
                        URL += SerializeData(Core.App.GetSessionInformation());
                        Core.UI.Popup.OpenPopup(URL, 'TicketAction');
                    });
                }
            }
            return false;
        });
    };

    TargetNS.UpdateSelectItems = function($Element, SelectALL) {
        var Status = $Element.prop('checked');
        $.each($(TicketElementSelectors[TicketView]), function(){
            if ( $(this).prop('checked') !== Status ) {
                $(this).prop('checked', Status).triggerHandler('click');
            }
        });

        if ( SelectALL ) {
            var SelectedItems     = $('input[name="SelectedItems"]').val().split(','),
                UnselectedItems   = $('input[name="UnselectedItems"]').val().split(','),
                ItemMerge         = $.merge(SelectedItems,UnselectedItems).filter(function(v){return v!==''});

            if ( Status ) {
                $('input[name="SelectedItems"]').val(ItemMerge);
                $('input[name="UnselectedItems"]').val('');
            } else {
                $('input[name="UnselectedItems"]').val(ItemMerge);
                $('input[name="SelectedItems"]').val('');
            }
        }
        return true;
    };

    TargetNS.TriggerUpdateActionRow = function($Element) {
        Core.UI.ActionRow.UpdateActionRow($('.SelectItem'), $(TicketElementSelectors[TicketView]), $('div.OverviewActions ul.Actions'));
        if ( $('#CreateWidespreadIncidentAction').length ) {
            $('#CreateWidespreadIncidentAction').attr('class',$('#BulkAction').attr('class')+' CreateWidespreadIncidentAction');
        }
    };

    TargetNS.InitShowContentDialog = function(Params, Dialog){
        var Div         = $('<div/>', { id: Params.ID, class: Params.Class}),
            Fieldset    = $('<fieldset/>', {class: 'TableLike FixedLabelSmall'}),
            Content     = Params.Content,
            Buttons;

        if ( Dialog === 'BulkDialog' ) {
            Content = Content.replace('###', Params.SelectedItems.length);
            Buttons = [
                {
                    Label: Params.Label[0],
                    Type: 'Submit',
                    Class: 'Primary',
                    Function: function () {
                        var ItemIDs = '';

                        $.each(Params.SelectedItems, function (index, value) {
                            ItemIDs += value + (Params.SelectedItems.length == (index + 1) ? "" : ",");
                        });

                        if ( !Params.SpecialParam ) {
                            Params.SpecialParam = '';
                        }
                        var Data = {
                                ItemIDs: ItemIDs,
                                Action: 'AgentPaginationAJAXHandler',
                                Subaction: 'UploadContentIDs',
                                CallAction: Params.Action,
                                FormID: Params.FormID,
                        };
                        Core.AJAX.FunctionCall(Core.Config.Get('Baselink'), Data, function(response) {
                            var URL = Core.Config.Get('Baselink') + "Action=" + Params.Action + ";Subaction=" + Params.Subaction + ";FormID=" + Params.FormID + Params.SpecialParam;
                            URL += SerializeData(Core.App.GetSessionInformation());
                            Core.UI.Popup.OpenPopup(URL, 'TicketAction');
                        });

                        Core.UI.Dialog.CloseDialog($('.Dialog:visible'));
                        return true;
                    }
                },
                {
                    Label: Params.Label[1],
                    Type: 'Close',
                    Class: 'Primary',
                    Function: function () {
                        return true;
                    }
                }
            ];
        } else {
            Buttons = [
                {
                    Label: Params.Label[0],
                    Type: 'Submit',
                    Class: 'Primary',
                    Function: function () {
                        TargetNS.UpdateSelectItems(Params.Element, false);
                        Core.UI.Dialog.CloseDialog($('.Dialog:visible'));
                        return true;
                    }
                },
                {
                    Label: Params.Label[1],
                    Type: 'Submit',
                    Class: 'Primary',
                    Function: function () {
                        TargetNS.UpdateSelectItems(Params.Element, true);
                        Core.UI.Dialog.CloseDialog($('.Dialog:visible'));
                        return true;
                    }
                }
            ];
        }

        Fieldset.append(Content);
        Div.append(Fieldset);

        Core.UI.Dialog.ShowContentDialog(Div, Params.Title, '15%', 'Center', true, Buttons, true);
    };
    return TargetNS;
}(Core.UI.ActionRow || {}));
