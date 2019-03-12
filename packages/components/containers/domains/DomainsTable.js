import React, { useEffect } from 'react';
import { c } from 'ttag';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from 'react-components';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';

const DomainsTable = ({ domains, loading, fetchMembers }) => {
    useEffect(() => {
        fetchMembers();
    }, []);
    return (
        <Table>
            <TableHeader
                cells={[
                    c('Header for addresses table').t`Domain`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`
                ]}
            />
            <TableBody loading={loading} colSpan={3}>
                {domains.map((domain) => {
                    const key = domain.ID;
                    return (
                        <TableRow
                            key={key}
                            cells={[
                                domain.DomainName,
                                <DomainStatus key={key} domain={domain} />,
                                <DomainActions key={key} domain={domain} />
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
    loading: PropTypes.bool.isRequired,
    fetchMembers: PropTypes.func.isRequired
};

const mapDispatchToProps = { fetchMembers };

export default connect(
    null,
    mapDispatchToProps
)(DomainsTable);
