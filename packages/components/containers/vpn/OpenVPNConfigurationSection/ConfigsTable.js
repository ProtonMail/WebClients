import React from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableRow,
    SmallButton,
    Tooltip,
    TableCell,
    useApiWithoutResult,
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
    SERVER: 'Server'
};

const PlusBadge = () => (
    <Tooltip title="Plus">
        <div className="aligncenter color-white rounded bg-plus" style={{ width: 22, height: 22 }}>
            P
        </div>
    </Tooltip>
);

const ServerDown = () => (
    <Tooltip title={c('Info').t`Server is currently down`}>
        <div className="flex inline-flex-vcenter">
            <Icon fill="warning" size={20} name="attention" />
        </div>
    </Tooltip>
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

    const handleClickDownload = (server) => async () => {
        const { ID, ExitCountry, Domain } = server;
        const buffer = await request({
            LogicalID: category === CATEGORY.COUNTRY ? undefined : ID,
            Platform: platform,
            Protocol: protocol,
            Country: ExitCountry
        });
        const blob = new Blob([buffer], { type: 'application/x-openvpn-profile' });
        downloadFile(blob, `${Domain}.${protocol}.ovpn`);
    };

    return (
        <Table>
            <thead>
                <tr>
                    <TableCell className="w50" type="header">
                        {category === CATEGORY.SERVER ? c('TableHeader').t`Name` : c('TableHeader').t`Country`}
                    </TableCell>
                    <TableCell className="w30" type="header">{c('TableHeader').t`Status`}</TableCell>
                    <TableCell className="w20" type="header">{c('TableHeader').t`Action`}</TableCell>
                </tr>
            </thead>
            <TableBody loading={loading} colSpan={3}>
                {servers.map((server) => (
                    <TableRow
                        key={server.ID}
                        cells={[
                            category === CATEGORY.SERVER ? server.Name : <Country key="country" server={server} />,
                            <div className="inline-flex-vcenter" key="status">
                                <span className="mr1-5">{server.Tier === 2 && <PlusBadge />}</span>
                                {!server.Status && <ServerDown />}
                                <LoadIndicator server={server} />
                                {isP2PEnabled(server.Features) && <P2P />}
                                {isTorEnabled(server.Features) && <Tor />}
                            </div>,
                            isUpgradeRequired(server) ? (
                                <Tooltip key="download" title={c('Info').t`Plan upgrade required`}>
                                    <SmallButton disabled>{c('Action').t`Download`}</SmallButton>
                                </Tooltip>
                            ) : (
                                <SmallButton key="download" onClick={handleClickDownload(server)}>{c('Action')
                                    .t`Download`}</SmallButton>
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
