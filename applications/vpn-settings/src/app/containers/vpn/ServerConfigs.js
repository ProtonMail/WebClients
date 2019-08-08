import React from 'react';
import PropTypes from 'prop-types';
import { isSecureCoreEnabled } from './utils';
import { groupWith } from 'proton-shared/lib/helpers/array';
import { Details, Summary, useUser, useSortedList } from 'react-components';
import ConfigsTable from './ConfigsTable';
import Country from './Country';
import useUserVPN from './userVPN/useUserVPN';

// TODO: free servers first in list, then sort by country
const ServerConfigs = ({ servers, ...rest }) => {
    const groupedServers = groupWith(
        (a, b) => a.Country === b.Country,
        servers.filter(({ Features = 0 }) => !isSecureCoreEnabled(Features))
    );

    const { isBasic, userVPN } = useUserVPN();
    const { hasPaidVPN } = useUser();
    const isUpgradeRequired = (server) =>
        !userVPN || (!hasPaidVPN && server.Tier > 0) || (isBasic && server.Tier === 2);

    return (
        <div className="mb1-5">
            {groupedServers.map((group) => {
                const server = group[0];
                return (
                    <Details key={server.Country}>
                        <Summary>
                            <div className="ml0-5">
                                <Country server={group[0]} />
                            </div>
                        </Summary>
                        <div className="p1">
                            <ConfigsTable
                                {...rest}
                                isUpgradeRequired={isUpgradeRequired}
                                isGroupedByCountry
                                servers={group}
                            />
                        </div>
                    </Details>
                );
            })}
        </div>
    );
};

ServerConfigs.propTypes = {
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

export default ServerConfigs;
