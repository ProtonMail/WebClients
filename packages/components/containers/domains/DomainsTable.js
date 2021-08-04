import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from '../../components';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';
import DomainName from './DomainName';

const DomainsTable = ({ domains = [], domainsAddressesMap = {}, loading = false }) => {
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
                    const domainAddresses = domainsAddressesMap[domain.ID] || [];
                    return (
                        <TableRow
                            key={domain.ID}
                            cells={[
                                <DomainName domain={domain} />,
                                <DomainStatus domain={domain} domainAddresses={domainAddresses} />,
                                <DomainActions domain={domain} domainAddresses={domainAddresses} />,
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
    domainsAddressesMap: PropTypes.object,
    loading: PropTypes.bool,
};

export default DomainsTable;
