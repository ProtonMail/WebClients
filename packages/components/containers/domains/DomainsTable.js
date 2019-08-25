import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from 'react-components';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';
import DomainName from './DomainName';
import DomainAddresses from './DomainAddresses';

const DomainsTable = ({ domains = [], domainsAddressesMap = {} }) => {
    return (
        <Table className="pm-simple-table--has-actions">
            <TableHeader
                cells={[
                    c('Header for addresses table').t`Domain`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Addresses`,
                    c('Header for addresses table').t`Actions`
                ]}
            />
            <TableBody>
                {domains.map((domain) => {
                    const domainAddresses = domainsAddressesMap[domain.ID] || [];
                    return (
                        <TableRow
                            key={domain.ID}
                            cells={[
                                <DomainName key={0} domain={domain} />,
                                <DomainStatus key={1} domain={domain} domainAddresses={domainAddresses} />,
                                <DomainAddresses key={2} domainAddresses={domainAddresses} />,
                                <DomainActions key={3} domain={domain} domainAddresses={domainAddresses} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

DomainsTable.propTypes = {
    domains: PropTypes.array,
    domainsAddressesMap: PropTypes.object
};

export default DomainsTable;
