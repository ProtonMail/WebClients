import React from 'react';
import PropTypes from 'prop-types';
import { textToClipboard } from 'proton-shared/lib/helpers/browser';
import {
    Table,
    TableBody,
    TableRow,
    SmallButton,
    DropdownActions,
    Tooltip,
    TableCell,
    useApiWithoutResult,
    useNotifications,
    Icon
} from 'react-components';
import { c } from 'ttag';

import LoadIndicator from './LoadIndicator';
import Country from './Country';
import { getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { isP2PEnabled, isTorEnabled } from './utils';

export const CATEGORY = {
    SECURE_CORE: 'SecureCore',
    COUNTRY: 'Country',
    SERVER: 'Server',
    FREE: 'Free'
};

const PlusBadge = () => (
    <span className="ml0-5">
        <Tooltip title="Plus">
            <div className="aligncenter color-white rounded bg-plus" style={{ width: 22, height: 22 }}>
                P
            </div>
        </Tooltip>
    </span>
);

const ServerDown = () => (
    <span className="ml0-5">
        <Tooltip title={c('Info').t`Server is currently down`}>
            <div className="flex inline-flex-vcenter">
                <Icon className="color-global-warning" size={20} name="attention" />
            </div>
        </Tooltip>
    </span>
);

const P2P = () => (
    <span className="ml0-5">
        <Tooltip title={c('Info').t`P2P`}>p2p</Tooltip>
    </span>
);

const Tor = () => (
    <span className="ml0-5">
        <Tooltip title={c('Info').t`Tor`}>tor</Tooltip>
    </span>
);

// TODO: Add icons instead of text for p2p and tor when they are ready
const ConfigsTable = ({ loading, servers = [], platform, protocol, category, isUpgradeRequired }) => {
    const { request } = useApiWithoutResult(getVPNServerConfig);
    const { createNotification } = useNotifications();

    const handleClickDownload = ({ ID, ExitCountry, Domain }) => async () => {
        const buffer = await request({
            LogicalID: category === CATEGORY.COUNTRY ? undefined : ID,
            Platform: platform,
            Protocol: protocol,
            Country: ExitCountry === 'GB' ? 'UK' : ExitCountry
        });
        const blob = new Blob([buffer], { type: 'application/x-openvpn-profile' });
        const [country, ...rest] = Domain.split('.');
        const domain = category === CATEGORY.COUNTRY ? [country.substring(0, 2), ...rest].join('.') : Domain;
        downloadFile(blob, `${domain}.${protocol}.ovpn`);
    };

    return (
        <Table className="pm-simple-table--has-actions">
            <thead>
                <tr>
                    <TableCell className="w40 onmobile-wauto" type="header">
                        {category === CATEGORY.SERVER ? c('TableHeader').t`Name` : c('TableHeader').t`Country`}
                    </TableCell>
                    <TableCell className="w30 onmobile-wauto" type="header">{c('TableHeader').t`Status`}</TableCell>
                    <TableCell className="w30 onmobile-wauto" type="header">{c('TableHeader').t`Action`}</TableCell>
                </tr>
            </thead>
            <TableBody loading={loading} colSpan={3}>
                {servers.map((server) => (
                    <TableRow
                        key={server.ID}
                        cells={[
                            category === CATEGORY.SERVER ? server.Name : <Country key="country" server={server} />,
                            <div className="inline-flex-vcenter" key="status">
                                <LoadIndicator server={server} />
                                {server.Tier === 2 && <PlusBadge />}
                                {server.Servers.every(({ Status }) => !Status) && <ServerDown />}
                                {isP2PEnabled(server.Features) && <P2P />}
                                {isTorEnabled(server.Features) && <Tor />}
                            </div>,
                            isUpgradeRequired(server) ? (
                                <Tooltip key="download" title={c('Info').t`Plan upgrade required`}>
                                    <SmallButton disabled>{c('Action').t`Download`}</SmallButton>
                                </Tooltip>
                            ) : (
                                <DropdownActions
                                    key="dropdown"
                                    className="pm-button--small"
                                    list={[
                                        {
                                            text: c('Action').t`Download`,
                                            onClick: handleClickDownload(server)
                                        },
                                        ...(category === CATEGORY.SECURE_CORE
                                            ? {}
                                            : {
                                                  text: (
                                                      <div className="flex flex-nowrap flex-items-center flex-spacebetween">
                                                          <span className="mr0-5">{server.Domain}</span>
                                                          <Icon name="clipboard" title={c('Action').t`Copy`} />
                                                      </div>
                                                  ),
                                                  onClick() {
                                                      textToClipboard(server.Domain);
                                                      createNotification({
                                                          text: c('Success')
                                                              .t`${server.Domain} copied in your clipboard`
                                                      });
                                                  }
                                              })
                                    ]}
                                />
                            )
                        ]}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

ConfigsTable.propTypes = {
    isUpgradeRequired: PropTypes.func.isRequired,
    isGroupedByCountry: PropTypes.bool,
    category: PropTypes.oneOf([CATEGORY.SECURE_CORE, CATEGORY.COUNTRY, CATEGORY.SERVER]),
    platform: PropTypes.string,
    protocol: PropTypes.string,
    loading: PropTypes.bool,
    servers: PropTypes.arrayOf(
        PropTypes.shape({
            ID: PropTypes.string,
            Country: PropTypes.string,
            EntryCountry: PropTypes.string,
            ExitCountry: PropTypes.string,
            Domain: PropTypes.string,
            Features: PropTypes.number,
            Load: PropTypes.number,
            Tier: PropTypes.number
        })
    )
};

export default ConfigsTable;
