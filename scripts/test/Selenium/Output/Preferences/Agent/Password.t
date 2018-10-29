# --
# Modified version of the work: Copyright (C) 2006-2018 c.a.p.e. IT GmbH, https://www.cape-it.de
# based on the original work of:
# Copyright (C) 2001-2018 OTRS AG, https://otrs.com/
# --
# This software comes with ABSOLUTELY NO WARRANTY. For details, see
# the enclosed file LICENSE for license information (AGPL). If you
# did not receive this file, see https://www.gnu.org/licenses/agpl.txt.
# --

use strict;
use warnings;
use utf8;

use vars (qw($Self));

# get selenium object
my $Selenium = $Kernel::OM->Get('Kernel::System::UnitTest::Selenium');

$Selenium->RunTest(
    sub {

        my $Helper = $Kernel::OM->Get('Kernel::System::UnitTest::Helper');

        my $TestUserLogin = $Helper->TestUserCreate(
            Groups => ['admin'],
        ) || die "Did not get test user";

        $Selenium->Login(
            Type     => 'Agent',
            User     => $TestUserLogin,
            Password => $TestUserLogin,
        );

        my $ScriptAlias = $Kernel::OM->Get('Kernel::Config')->Get('ScriptAlias');

        # go to agent preferences
        $Selenium->VerifiedGet("${ScriptAlias}index.pl?Action=AgentPreferences");

        # wait until form has loaded, if neccessary
        $Selenium->WaitFor( JavaScript => 'return typeof($) === "function" && $("body").length' );

        # change test user password preference, input incorrect current password
        my $NewPw = "new" . $TestUserLogin;
        $Selenium->find_element( "#CurPw",  'css' )->send_keys("incorrect");
        $Selenium->find_element( "#NewPw",  'css' )->send_keys($NewPw);
        $Selenium->find_element( "#NewPw1", 'css' )->send_keys($NewPw);
        $Selenium->find_element( "#CurPw",  'css' )->VerifiedSubmit();

        # wait until form has loaded, if neccessary
        $Selenium->WaitFor( JavaScript => 'return typeof($) === "function" && $("body").length' );

        # check for incorrect password update preferences message on screen
        my $IncorrectUpdateMessage = "The current password is not correct. Please try again!";
        $Self->True(
            index( $Selenium->get_page_source(), $IncorrectUpdateMessage ) > -1,
            'Agent incorrect preferences password - update'
        );

        # change test user password preference, correct input
        $Selenium->find_element( "#CurPw",  'css' )->send_keys($TestUserLogin);
        $Selenium->find_element( "#NewPw",  'css' )->send_keys($NewPw);
        $Selenium->find_element( "#NewPw1", 'css' )->send_keys($NewPw);
        $Selenium->find_element( "#CurPw",  'css' )->VerifiedSubmit();

        # wait until form has loaded, if neccessary
        $Selenium->WaitFor( JavaScript => 'return typeof($) === "function" && $("body").length' );

        # check for correct password update preferences message on screen
        my $UpdateMessage = "Preferences updated successfully!";
        $Self->True(
            index( $Selenium->get_page_source(), $UpdateMessage ) > -1,
            'Agent preference password - updated'
        );
    }
);

1;

=back

=head1 TERMS AND CONDITIONS

This software is part of the KIX project
(L<https://www.kixdesk.com/>).

This software comes with ABSOLUTELY NO WARRANTY. For details, see the enclosed file
LICENSE for license information (AGPL). If you did not receive this file, see

<https://www.gnu.org/licenses/agpl.txt>.

=cut
