import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Block, Loader, SubTitle, useOrganization, useMembers } from 'react-components';

import AddressesToolbar from './AddressesToolbar';
import AddressesTable from './AddressesTable';

const AddressesWithMembers = () => {
    const [member, setMember] = useState();
    const [members = [], loading] = useMembers();

    useEffect(() => {
        if (members.length) {
            setMember(members.find(({ Self }) => Self));
        }
    }, [loading]);

    if (loading || !member) {
        return <Loader />;
    }

    return (
        <>
            <AddressesToolbar onChangeMember={setMember} members={members} member={member} />
            <AddressesTable member={member} members={members} />
        </>
    );
};

const AddressesSection = () => {
    const [{ MaxMembers, UsedAddresses, MaxAddresses } = {}] = useOrganization();

    return (
        <>
            <SubTitle>{c('Title').t`Addresses`}</SubTitle>
            {MaxMembers > 1 ? <AddressesWithMembers /> : <AddressesTable />}
            {MaxAddresses > 1 ? (
                <Block className="opacity-50">
                    {UsedAddresses} / {MaxAddresses}{' '}
                    {c('Info').ngettext('address used', 'addresses used', UsedAddresses)}
                </Block>
            ) : null}
        </>
    );
};

export default AddressesSection;
