import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { SubTitle, Table, TableHeader, TableRow, TableBody, useApiWithoutResult } from 'react-components';
import { queryAddresses } from 'proton-shared/lib/api/members';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import AddressesToolbar from './AddressesToolbar';

const AddressesSection = ({ addresses, fetchMembers, members }) => {
    const { request, loading } = useApiWithoutResult(queryAddresses);
    const [selectedAddresses, setAddresses] = useState(addresses.data);
    const [member, setMember] = useState();

    const fetchAddresses = async () => {
        if (!member) {
            return [];
        }

        if (member.Self) {
            return setAddresses(addresses.data);
        }

        const { Addresses } = await request(member.ID);

        setAddresses(Addresses);
    };

    useEffect(() => {
        const currentUser = members.data.find(({ Self }) => Self);
        setMember(currentUser);
    }, [members.data]);

    useEffect(() => {
        fetchMembers();
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [member]);

    return (
        <>
            <SubTitle>{c('Title').t`Addresses`}</SubTitle>
            {member ? (
                <AddressesToolbar onChangeMember={setMember} loading={loading} members={members.data} member={member} />
            ) : null}
            <Table>
                <TableHeader
                    cells={[
                        c('Header for addresses table').t`Address`,
                        c('Header for addresses table').t`Status`,
                        c('Header for addresses table').t`Actions`
                    ]}
                />
                <TableBody loading={loading} colSpan={3}>
                    {selectedAddresses.map((address, index) => {
                        const key = address.ID;
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    address.Email,
                                    <AddressStatus key={key} address={address} index={index} />,
                                    member ? (
                                        <AddressActions key={key} member={member} address={address} index={index} />
                                    ) : null
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

AddressesSection.propTypes = {
    addresses: PropTypes.object.isRequired,
    fetchMembers: PropTypes.func.isRequired,
    members: PropTypes.object.isRequired
};

const mapStateToProps = ({ addresses, members }) => ({ addresses, members });
const mapDispatchToProps = { fetchMembers };

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddressesSection);
