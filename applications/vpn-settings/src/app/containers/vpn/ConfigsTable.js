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
    useSortedList,
    Icon
} from 'react-components';
import { c } from 'ttag';
import LoadIndicator from './LoadIndicator';
import Country from './Country';
import { getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';

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

// TODO: show warning indicator and other missing stuff
// TODO: user TIER free=0 otherwise vpn tier
const ConfigsTable = ({ loading, servers = [], platform, protocol, isGroupedByCountry }) => {
    const { request } = useApiWithoutResult(getVPNServerConfig);

    const handleClickDownload = (server) => async () => {
        const { ID, ExitCountry, Domain } = server;
        const buffer = await request({
            LogicalID: ID,
            Platform: platform,
            Protocol: protocol,
            Country: ExitCountry
        });
        const blob = new Blob([buffer], { type: 'application/x-openvpn-profile' });
        downloadFile(blob, `${Domain}.${protocol}.ovpn`);
    };

    const { sortedList } = useSortedList(servers, { key: 'Country', direction: SORT_DIRECTION.ASC });

    return (
        <Table>
            <thead>
                <tr>
                    <TableCell className="w50" type="header">
                        {isGroupedByCountry ? c('TableHeader').t`Name` : c('TableHeader').t`Country`}
                    </TableCell>
                    <TableCell className="w30" type="header">{c('TableHeader').t`Status`}</TableCell>
                    <TableCell className="w20" type="header">{c('TableHeader').t`Action`}</TableCell>
                </tr>
            </thead>
            <TableBody loading={loading} colSpan={3}>
                {sortedList.map((server) => (
                    <TableRow
                        key={server.ID}
                        cells={[
                            isGroupedByCountry ? server.Name : <Country key="country" server={server} />,
                            <div className="inline-flex-vcenter" key="status">
                                <span className="mr1-5">{server.Tier === 2 && <PlusBadge />}</span>
                                {!server.Status && <ServerDown />}
                                <LoadIndicator server={server} />
                            </div>,
                            <SmallButton key="download" onClick={handleClickDownload(server)}>{c('Action')
                                .t`Download`}</SmallButton>
                        ]}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

ConfigsTable.propTypes = {
    isGroupedByCountry: PropTypes.bool,
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
