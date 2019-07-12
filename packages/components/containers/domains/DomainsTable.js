import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from 'react-components';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';
import DomainName from './DomainName';
import DomainAddresses from './DomainAddresses';

const DomainsTable = ({ domains, onRedirect }) => {
    return (
        <Table>
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
                    return (
                        <TableRow
                            key={domain.ID}
                            cells={[
                                <DomainName key={0} domain={domain} />,
                                <DomainStatus key={1} domain={domain} />,
                                <DomainAddresses key={2} domain={domain} />,
                                <DomainActions key={3} domain={domain} onRedirect={onRedirect} />
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

DomainsTable.propTypes = {
    domains: PropTypes.array.isRequired,
    onRedirect: PropTypes.func.isRequired
};

export default DomainsTable;
