import { c, msgid } from 'ttag';

import { Copy, TableRow } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';

import { Gateway } from './Gateway';
import { GatewayLogical } from './GatewayLogical';
import GatewayManageButton from './GatewayManageButton';
import { GatewayServer } from './GatewayServer';
import { GatewayUser } from './GatewayUser';
import { getCountryFlagAndName } from './getCountryFlagAndName';
import { getFormattedLoad, getMembers, getSuffix } from './helpers';

interface Props {
    isAdmin: boolean;
    showDeleted?: boolean;
    showIPv4?: boolean;
    showIPv6?: boolean;
    showLoad?: boolean;
    gateway: Gateway;
    isDeleted: (logical: GatewayLogical) => boolean;
    users: readonly GatewayUser[];
    language: string | readonly string[];
    provisioningDuration: string;
    deletingLogicals: readonly string[];
    deletedLogicals: Record<string, boolean>;
    renameGateway: (id: string, name: string) => () => any;
    editGatewayServers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    editGatewayUsers: (gateway: Gateway, logical: GatewayLogical) => () => any;
    deleteGateway: (gateway: Gateway) => () => any;
}

export const GatewayRow = ({
    isAdmin,
    showDeleted,
    showIPv4,
    showIPv6,
    showLoad,
    gateway,
    isDeleted,
    users,
    language,
    provisioningDuration,
    renameGateway,
    editGatewayServers,
    editGatewayUsers,
    deleteGateway,
    deletingLogicals,
    deletedLogicals,
}: Props) => {
    const { createNotification } = useNotifications();

    let provisioningCounter = 0;
    const allLogicals = gateway.Logicals || [];
    const deleted = allLogicals.every(isDeleted);

    if (deleted && !showDeleted) {
        return <></>;
    }

    const logicals = allLogicals.filter((logical) => {
        if (isDeleted(logical)) {
            return false;
        }

        if (!logical.Servers?.length) {
            provisioningCounter++;

            return false;
        }

        return true;
    });
    const provisionedLogicals = [...logicals.filter((l) => l.Visible), ...logicals.filter((l) => !l.Visible)];
    const hasPendingServers = provisioningCounter > 0;
    const main = provisionedLogicals[0] || allLogicals[0];
    const [statusClasses, statusText] = provisionedLogicals.length
        ? ['bg-success', /** translator: status of the gateway: people can connect to it */ c('Info').t`active`]
        : [
              'bg-weak color-weak',
              /** translator: status of the gateway: people cannot connect to it */ c('Info').t`inactive`,
          ];

    const getIpsCell = (servers: GatewayServer[]) =>
        servers[0]
            ? [
                  ...(showIPv4 ? [servers[0].ExitIPv4] : []),
                  ...(showIPv6 ? [servers[0].ExitIPv6] : []),
                  ...(showLoad ? [getFormattedLoad(servers)] : []),
              ].join(', ')
            : c('Action').t`Your server will be provisioned in the next days`;

    return (
        <TableRow
            className={deleted ? 'opacity-50' : undefined}
            cells={[
                gateway.Name,
                <span className={clsx(['py-1 px-2 rounded text-uppercase', statusClasses])}>{statusText}</span>,
                <div>
                    {provisionedLogicals.length < 1 && !hasPendingServers && '0'}
                    {provisionedLogicals.map((logical) => (
                        <div key={'logical-' + logical.ID}>
                            <span className="text-nowrap bg-weak py-1 px-2 rounded">
                                {getCountryFlagAndName(language, logical.ExitCountry, getSuffix(logical.Name), {
                                    className: 'mb-1',
                                    key: 'country-logical-' + logical.ID + '-' + logical.ExitCountry,
                                })}
                                <span className="color-weak">&nbsp; • &nbsp;</span>
                                {getIpsCell(logical.Servers)}
                                <Copy
                                    value={logical.Servers[0].ExitIPv4}
                                    shape="ghost"
                                    onCopy={() => {
                                        createNotification({
                                            text: c('Notification').t`IP Address copied to clipboard`,
                                        });
                                    }}
                                />
                            </span>
                        </div>
                    ))}
                    {hasPendingServers && (
                        <div className="color-weak">
                            {c('Info').ngettext(
                                msgid`${provisioningCounter} server is still being set up. This usually takes around ${provisioningDuration}.`,
                                `${provisioningCounter} servers are still being set up. This usually takes around ${provisioningDuration}.`,
                                provisioningCounter
                            )}
                        </div>
                    )}
                </div>,
                ...(isAdmin
                    ? [
                          getMembers(users, main),
                          <GatewayManageButton
                              gateway={gateway}
                              logical={main}
                              renameGateway={renameGateway}
                              editGatewayServers={editGatewayServers}
                              editGatewayUsers={editGatewayUsers}
                              deleteGateway={deleteGateway}
                              deletingLogicals={deletingLogicals}
                              deletedLogicals={deletedLogicals}
                              deleted={deleted}
                          />,
                      ]
                    : []),
            ]}
        />
    );
};

export default GatewayRow;
