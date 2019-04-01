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
import { ALL_MEMBERS_ID } from 'proton-shared/lib/constants';

import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';
import AddressesToolbar from './AddressesToolbar';

const AddressesSection = () => {
    const [addresses = []] = useAddresses();
    const [members = [], loadingMembers] = useMembers();
    const [user] = useUser();

    const { request, loading } = useApiWithoutResult(queryAddresses);
    const [selectedAddresses, setAddresses] = useState([]);
    const [member, setMember] = useState();

    const formatAddresses = (addresses = {}, member) => addresses.map((address) => ({ ...address, member }));

    const fetchAddresses = async () => {
        if (!member) {
            return [];
        }

        if (member.ID === ALL_MEMBERS_ID) {
            return setAddresses(
                await Promise.all(
                    members.map((member) => {
                        if (member.Self) {
                            return formatAddresses(addresses, member);
                        }
                        return request(member.ID).then(({ Addresses }) => formatAddresses(Addresses, member));
                    })
                ).then((result) => result.reduce((acc, addresses) => acc.concat(addresses), []))
            );
        }

        if (member.Self) {
            return setAddresses(formatAddresses(addresses, member));
        }

        const { Addresses } = await request(member.ID);

        setAddresses(formatAddresses(Addresses, member));
    };

    useEffect(() => {
        const currentUser = members.find(({ Self }) => Self);

        if (currentUser) {
            setMember(currentUser);
        }
    }, [members]);

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
                                    loadingMembers ? null : (
                                        <AddressActions
                                            user={user}
                                            key={key}
                                            address={address}
                                            fetchAddresses={fetchAddresses}
                                        />
                                    )
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
