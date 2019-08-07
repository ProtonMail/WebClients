import React from 'react';
import PropTypes from 'prop-types';
import { isSecureCoreEnabled } from './utils';
import { groupWith } from 'proton-shared/lib/helpers/array';
import { Details, Summary } from 'react-components';
import ConfigsTable from './ConfigsTable';
import Country from './Country';

// TODO: free servers first in list, then sort by country
const ServerConfigs = ({ servers, ...rest }) => {
    const groupedServers = groupWith(
        (a, b) => a.Country === b.Country,
        servers.filter(({ Features = 0 }) => !isSecureCoreEnabled(Features))
    );

    return groupedServers.map((group) => (
        <Details key={group[0].Country}>
            <Summary>
                <div className="ml0-5">
                    <Country server={group[0]} />
                </div>
            </Summary>
            <div className="p1">
                <ConfigsTable {...rest} isGroupedByCountry servers={group} />
            </div>
        </Details>
    ));
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
