import React, { useEffect } from 'react';
import { c } from 'ttag';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow } from 'react-components';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';

import DomainStatus from './DomainStatus';
import DomainActions from './DomainActions';
import AddressesTable from './AddressesTable';

const DomainsTable = ({ domains, members, loading, fetchMembers }) => {
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
            <TableBody loading={loading}>
                {domains.map((domain) => {
                    const key = domain.ID;
                    return (
                        <React.Fragment key={key}>
                            <TableRow
                                cells={[
                                    domain.DomainName,
                                    <DomainStatus key={key} domain={domain} />,
                                    <DomainActions key={key} domain={domain} />
                                ]}
                            />
                            <tr>
                                <td colSpan="3">
                                    <AddressesTable
                                        key={key}
                                        loading={members.loading}
                                        domain={domain}
                                        members={members.data}
                                    />
                                </td>
                            </tr>
                        </React.Fragment>
                    );
                })}
            </TableBody>
        </Table>
    );
};

DomainsTable.propTypes = {
    domains: PropTypes.array.isRequired,
    members: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    fetchMembers: PropTypes.func.isRequired
};

const mapStateToProps = ({ members }) => ({ members });
const mapDispatchToProps = { fetchMembers };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DomainsTable);
