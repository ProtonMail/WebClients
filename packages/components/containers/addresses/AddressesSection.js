import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import {
    useUser,
    useAddresses,
    useMembers,
    SubTitle,
    Table,
    TableHeader,
    TableRow,
    TableBody,
    useApiWithoutResult
} from 'react-components';
import { queryAddresses } from 'proton-shared/lib/api/members';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import AddressesToolbar from './AddressesToolbar';

const AddressesSection = () => {
    const [addresses = []] = useAddresses();
    const [members = [], loadMembers] = useMembers();
    const [user] = useUser();

    const { request, loading } = useApiWithoutResult(queryAddresses);
    const [selectedAddresses, setAddresses] = useState(addresses);
    const [member, setMember] = useState();

    const fetchAddresses = async () => {
        if (!member) {
            return [];
        }

        if (member.Self) {
            return setAddresses(addresses);
        }

        const { Addresses } = await request(member.ID);

        setAddresses(Addresses);
    };

    useEffect(() => {
        const currentUser = members.find(({ Self }) => Self);
        setMember(currentUser);
    }, [members]);

    useEffect(() => {
        loadMembers(); // TODO: handle initialized case
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [member]);

    return (
        <>
            <SubTitle>{c('Title').t`Addresses`}</SubTitle>
            {member ? (
                <AddressesToolbar onChangeMember={setMember} loading={loading} members={members} member={member} />
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
                                        <AddressActions
                                            user={user}
                                            key={key}
                                            member={member}
                                            address={address}
                                            index={index}
                                        />
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

export default AddressesSection;
