import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import withPermissionGuard from '@proton/components/components/orgPermissions/withPermissionGuard';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import type { CountryOptions } from '@proton/payments/core/countries';

import type { Gateway, GatewayGroup, GatewayLogical, GatewayUser } from '../../../types/Gateway';
import { GatewayRow } from './GatewayRow';

const GuardedCreateGatewayButton = withPermissionGuard('account.gateway.create')(Button);

interface Props {
    gateways: readonly Gateway[];
    countryOptions: CountryOptions;
    users: GatewayUser[];
    groups: GatewayGroup[];
    canViewGateways: boolean;
    canAdd: boolean;
    showDeleted?: boolean;
    showIPv4?: boolean;
    showIPv6?: boolean;
    showLoad?: boolean;
    provisioningDuration: string;
    deletingLogicals: readonly string[];
    deletedLogicals: Record<string, boolean>;
    renameGateway: (id: string, name: string) => () => void;
    editGatewayServers: (gateway: Gateway, logical: GatewayLogical) => () => void;
    editGatewayUsers: (gateway: Gateway, logical: GatewayLogical) => () => void;
    deleteGateway: (gateway: Gateway) => () => void;
    addGateway: () => void;
}

export const GatewaysTableView = ({
    gateways,
    countryOptions,
    users,
    groups,
    canViewGateways,
    canAdd,
    showDeleted,
    showIPv4,
    showIPv6,
    showLoad,
    provisioningDuration,
    deletingLogicals,
    deletedLogicals,
    renameGateway,
    editGatewayServers,
    editGatewayUsers,
    deleteGateway,
    addGateway,
}: Props) => (
    <>
        {canViewGateways && (
            <div className="mb-4">
                <GuardedCreateGatewayButton
                    color="norm"
                    disabled={!canAdd}
                    onClick={addGateway}
                    title={c('Title').t`Create a new Gateway`}
                >
                    {c('Action').t`Create Gateway`}
                </GuardedCreateGatewayButton>
            </div>
        )}

        <Table className="my-2" responsive="cards">
            <thead>
                <tr>
                    <TableCell key="name" type="header" className="w-1/5">{c('Header').t`Name`}</TableCell>
                    <TableCell key="status" type="header" className="w-1/6">
                        {c('Header').t`Status`}
                    </TableCell>
                    <TableCell key="servers" type="header">{c('Header').t`Servers`}</TableCell>
                    {canViewGateways && (
                        <>
                            <TableCell key="members" type="header" className="w-1/5">
                                {c('Header').t`Members`}
                            </TableCell>
                            <TableCell key="manage" type="header" className="w-1/10">
                                &nbsp;
                            </TableCell>
                        </>
                    )}
                </tr>
            </thead>
            <TableBody colSpan={3 + (canViewGateways ? 2 : 0)}>
                {gateways.map((gateway) => (
                    <GatewayRow
                        countryOptions={countryOptions}
                        key={`gateway-${gateway.Name}`}
                        isAdmin={canViewGateways}
                        showDeleted={showDeleted}
                        showIPv4={showIPv4}
                        showIPv6={showIPv6}
                        showLoad={showLoad}
                        gateway={gateway}
                        users={users}
                        groups={groups}
                        provisioningDuration={provisioningDuration}
                        renameGateway={renameGateway}
                        editGatewayServers={editGatewayServers}
                        editGatewayUsers={editGatewayUsers}
                        deleteGateway={deleteGateway(gateway)}
                        deletingLogicals={deletingLogicals}
                        deletedLogicals={deletedLogicals}
                    />
                ))}
            </TableBody>
        </Table>
    </>
);
