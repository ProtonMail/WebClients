import { Organization } from 'proton-shared/lib/interfaces';
import React from 'react';

import { useUser } from '../../hooks';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization: Organization;
}

const Addresses = ({ isOnlySelf, organization }: AddressesProps) => {
    const [user] = useUser();

    return user.isAdmin ? (
        <AddressesWithMembers isOnlySelf={isOnlySelf} user={user} organization={organization} />
    ) : (
        <AddressesWithUser user={user} />
    );
};

export default Addresses;
