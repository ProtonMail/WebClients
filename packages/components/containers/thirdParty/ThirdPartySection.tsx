import { c } from 'ttag';

import { useOAuthToken } from '@proton/activation';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';

import SettingsSectionWide from '../account/SettingsSectionWide';
import { ProviderAction, ProviderIcon, ProviderReason } from './ThirdPartyComponents';
import { SupportedProviders } from './interface';

export const ThirdPartySection = () => {
    const [token, loading] = useOAuthToken();
    const hasZoom = !loading && token?.some(({ Provider }) => Provider === OAUTH_PROVIDER.ZOOM);

    return (
        <SettingsSectionWide>
            <Table hasActions responsive="cards">
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-2/10">{c('Title').t`Service`}</TableHeaderCell>
                        <TableHeaderCell className="w-6/10">{c('Title').t`Description`}</TableHeaderCell>
                        <TableHeaderCell className="w-2/10">{c('Title').t`Connection status`}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody colSpan={4} loading={loading}>
                    <TableRow>
                        <TableCell>
                            <ProviderIcon provider={SupportedProviders.zoom} />
                        </TableCell>
                        <TableCell>
                            <ProviderReason provider={SupportedProviders.zoom} />
                        </TableCell>
                        <TableCell>
                            <ProviderAction provider={SupportedProviders.zoom} connected={hasZoom} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </SettingsSectionWide>
    );
};
