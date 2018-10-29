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

# get layout object
my $LayoutObject = $Kernel::OM->Get('Kernel::Output::HTML::Layout');

my @Tests = (
    {
        Name  => 'Simple URL',
        Input => 'http://www.url.com',
    },
    {
        Name  => 'URL with parameters',
        Input => 'http://www.url.com?parameter=test;parameter2=test2',
    },
    {
        Name  => 'URL with round brackets',
        Input => 'http://www.url.com/file(1)name/file(2)name',
    },
    {
        Name  => 'URL with square brackets',
        Input => 'http://www.url.com?host[0]=hostname;[1]',
    },
    {
        Name  => 'URL with curly brackets',
        Input => 'http://www.url.com?host{0}=hostname;{1}',
    },
);

for my $Test (@Tests) {

    my $Output = $LayoutObject->Ascii2Html(
        Text        => $Test->{Input},
        LinkFeature => 1,
    );

    $Self->Is(
        $Output,
        '<a href="'
            . $Test->{Input}
            . '" target="_blank" title="'
            . $Test->{Input} . '">'
            . $Test->{Input} . '</a>',
        $Test->{Name},
    );
}

1;

=back

=head1 TERMS AND CONDITIONS

This software is part of the KIX project
(L<https://www.kixdesk.com/>).

This software comes with ABSOLUTELY NO WARRANTY. For details, see the enclosed file
LICENSE for license information (AGPL). If you did not receive this file, see

<https://www.gnu.org/licenses/agpl.txt>.

=cut
