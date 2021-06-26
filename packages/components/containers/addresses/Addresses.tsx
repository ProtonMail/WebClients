import { Organization } from '@proton/shared/lib/interfaces';
import React from 'react';

import { useUser } from '../../hooks';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization: Organization;
    memberID?: string;
}

const Addresses = ({ isOnlySelf, organization, memberID }: AddressesProps) => {
    const [user] = useUser();

    return user.isAdmin && user.hasPaidMail ? (
        <AddressesWithMembers isOnlySelf={isOnlySelf} user={user} memberID={memberID} organization={organization} />
    ) : (
        <AddressesWithUser user={user} />
    );
};

export default Addresses;
