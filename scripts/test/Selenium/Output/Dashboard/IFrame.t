# --
# Modified version of the work: Copyright (C) 2006-2019 c.a.p.e. IT GmbH, https://www.cape-it.de
# based on the original work of:
# Copyright (C) 2001-2019 OTRS AG, https://otrs.com/
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

        # get helper object
        my $Helper = $Kernel::OM->Get('Kernel::System::UnitTest::Helper');

        # get dashboard IFrame plugin default sysconfig
        my %IFrameConfig = $Kernel::OM->Get('Kernel::System::SysConfig')->ConfigItemGet(
            Name    => 'DashboardBackend###0300-IFrame',
            Default => 1,
        );

        # set dashboard IFrame plugin to valid
        my %IFrameConfigUpdate = map { $_->{Key} => $_->{Content} }
            grep { defined $_->{Key} } @{ $IFrameConfig{Setting}->[1]->{Hash}->[1]->{Item} };

        $Helper->ConfigSettingChange(
            Valid => 1,
            Key   => 'DashboardBackend###0300-IFrame',
            Value => \%IFrameConfigUpdate,
        );

        # create test user and login
        my $TestUserLogin = $Helper->TestUserCreate(
            Groups => [ 'admin', 'users' ],
        ) || die "Did not get test user";

        $Selenium->Login(
            Type     => 'Agent',
            User     => $TestUserLogin,
            Password => $TestUserLogin,
        );

        # test if IFrame plugin shows correct link
        my $IFrameLink = $IFrameConfig{Setting}->[1]->{Hash}->[1]->{Item}->[8]->{Content};
        $Self->True(
            index( $Selenium->get_page_source(), $IFrameLink ) > -1,
            "IFrame dashboard plugin link '$IFrameLink' - found",
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
