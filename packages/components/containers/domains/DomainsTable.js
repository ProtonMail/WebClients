import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from '../../components';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';
import DomainName from './DomainName';

const DomainsTable = ({ domains = [], loading = false }) => {
    return (
        <Table className="simple-table--has-actions">
            <TableHeader
                cells={[
                    c('Header for addresses table').t`Domain`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`,
                ]}
            />
            <TableBody loading={loading} colSpan={4}>
                {domains.map((domain) => {
                    return (
                        <TableRow
                            key={domain.ID}
                            cells={[
                                <DomainName domain={domain} />,
                                <DomainStatus domain={domain} domainAddresses={domain.addresses} />,
                                <DomainActions domain={domain} domainAddresses={domain.addresses} />,
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
    loading: PropTypes.bool,
};

export default DomainsTable;
