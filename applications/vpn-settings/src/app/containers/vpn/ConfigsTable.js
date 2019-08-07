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
    useSortedList
} from 'react-components';
import { c } from 'ttag';
import LoadIndicator from './LoadIndicator';
import Country from './Country';
import { getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { getCountryByAbbr } from 'react-components/helpers/countries';

const PlusBadge = () => (
    <Tooltip title="Plus">
        <div className="aligncenter color-white rounded bg-plus" style={{ width: 22, height: 22 }}>
            P
        </div>
    </Tooltip>
);

// TODO: show warning indicator and other missing stuff
// TODO: user TIER free=0 otherwise vpn tier
const ConfigsTable = ({ loading, servers = [], platform, protocol }) => {
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

    const serversWithCountry = servers.map((server) => ({ ...server, Country: getCountryByAbbr(server.ExitCountry) }));
    const { sortedList } = useSortedList(serversWithCountry, { key: 'Country', direction: SORT_DIRECTION.ASC });

    return (
        <Table>
            <thead>
                <tr>
                    <TableCell className="w50" type="header">{c('TableHeader').t`Country`}</TableCell>
                    <TableCell className="w30" type="header">{c('TableHeader').t`Status`}</TableCell>
                    <TableCell className="w20" type="header">{c('TableHeader').t`Action`}</TableCell>
                </tr>
            </thead>
            <TableBody loading={loading} colSpan={3}>
                {sortedList.map((server) => {
                    const { ID, EntryCountry, ExitCountry, Load, Tier } = server;
                    return (
                        <TableRow
                            key={ID}
                            cells={[
                                <Country key="country" entry={EntryCountry} exit={ExitCountry} />,
                                <div className="inline-flex-vcenter" key="status">
                                    <span className="mr1-5">{Tier === 2 && <PlusBadge />}</span>
                                    <LoadIndicator load={Load} />
                                </div>,
                                <SmallButton key="download" onClick={handleClickDownload(server)}>{c('Action')
                                    .t`Download`}</SmallButton>
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

ConfigsTable.propTypes = {
    platform: PropTypes.string,
    protocol: PropTypes.string,
    loading: PropTypes.bool,
    servers: PropTypes.arrayOf(
        PropTypes.shape({
            ExitCountry: PropTypes.string,
            Features: PropTypes.number,
            Load: PropTypes.number
        })
    )
};

export default ConfigsTable;
