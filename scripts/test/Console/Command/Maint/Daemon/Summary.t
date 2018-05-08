# --
# Modified version of the work: Copyright (C) 2006-2018 c.a.p.e. IT GmbH, http://www.cape-it.de
# based on the original work of:
# Copyright (C) 2001-2018 OTRS AG, http://otrs.com/
# --
# This software comes with ABSOLUTELY NO WARRANTY. For details, see
# the enclosed file COPYING for license information (AGPL). If you
# did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
# --

use strict;
use warnings;
use utf8;

use vars (qw($Self));

# get helper object
$Kernel::OM->ObjectParamAdd(
    'Kernel::System::UnitTest::Helper' => {
        RestoreDatabase => 1,
    },
);
my $Helper = $Kernel::OM->Get('Kernel::System::UnitTest::Helper');

# prepare the environment
my $Success = $Kernel::OM->Get('Kernel::Config')->Set(
    Key   => 'DaemonModules###UnitTest1',
    Value => '1',
);
$Self->True(
    $Success,
    "Added UnitTest1 daemon to the config",
);
$Success = $Kernel::OM->Get('Kernel::Config')->Set(
    Key   => 'DaemonModules###UnitTest2',
    Value => {
        AnyKey => 1,
    },
);
$Self->True(
    $Success,
    "Added UnitTest2 daemon to the config",
);
$Success = $Kernel::OM->Get('Kernel::Config')->Set(
    Key   => 'DaemonModules###UnitTest3',
    Value => {
        Module => 'Kernel::System::Daemon::DaemonModules::NotExistent',
    },
);
$Self->True(
    $Success,
    "Added UnitTest3 daemon to the config",
);

my @Tests = (
    {
        Name     => 'No hash setting daemon module',
        Params   => ['UnitTest1'],
        ExitCode => 1,
    },
    {
        Name     => 'Wrong module setting daemon module',
        Params   => ['UnitTest2'],
        ExitCode => 1,
    },
    {
        Name     => 'Not existing module setting daemon module',
        Params   => ['UnitTest3'],
        ExitCode => 1,
    },
    {
        Name     => 'Not existing daemon module',
        Params   => ['UnitTestNotExisiting'],
        ExitCode => 1,
    },
    {
        Name     => 'SchedulerTaskWorker daemon module',
        Params   => ['SchedulerTaskWorker'],
        ExitCode => 0,
    },
    {
        Name     => 'All daemon modules',
        Params   => [],
        ExitCode => 0,
    },
);

my $CommandObject = $Kernel::OM->Get('Kernel::System::Console::Command::Maint::Daemon::Summary');

for my $Test (@Tests) {

    my $ExitCode = $CommandObject->Execute( @{ $Test->{Params} } );

    $Self->Is(
        $ExitCode,
        $Test->{ExitCode},
        "$Test->{Name} Command exit code",
    );
}

# cleanup cache is done by RestoreDatabase

1;

=back

=head1 TERMS AND CONDITIONS

This software is part of the KIX project
(L<http://www.kixdesk.com/>).

This software comes with ABSOLUTELY NO WARRANTY. For details, see the enclosed file
COPYING for license information (AGPL). If you did not receive this file, see

<http://www.gnu.org/licenses/agpl.txt>.

=cut
