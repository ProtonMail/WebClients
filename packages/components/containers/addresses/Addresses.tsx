import { useAllowAddressDeletion } from '@proton/components';
import type { Organization } from '@proton/shared/lib/interfaces';

import { useUser } from '../../hooks';
import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization?: Organization;
    memberID?: string;
    hasDescription?: boolean;
}

const Addresses = ({ isOnlySelf, organization, memberID, hasDescription }: AddressesProps) => {
    const [user] = useUser();
    const [allowAddressDeletion] = useAllowAddressDeletion();

    return user.isAdmin && user.hasPaidMail ? (
        <AddressesWithMembers
            isOnlySelf={isOnlySelf}
            user={user}
            memberID={memberID}
            organization={organization}
            allowAddressDeletion={allowAddressDeletion ?? false}
            hasDescription={hasDescription}
        />
    ) : (
        <AddressesWithUser
            user={user}
            allowAddressDeletion={allowAddressDeletion ?? false}
            hasDescription={hasDescription}
        />
    );
};

export default Addresses;
