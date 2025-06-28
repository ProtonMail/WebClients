import { useAllowAddressDeletion } from '@proton/account/allowAddressDeletion/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { Organization } from '@proton/shared/lib/interfaces';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization?: Organization;
    memberID?: string;
    hasDescription?: boolean;
    hasAccessToBYOE?: boolean;
}

const Addresses = ({ isOnlySelf, organization, memberID, hasDescription, hasAccessToBYOE }: AddressesProps) => {
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
            hasAccessToBYOE={hasAccessToBYOE}
        />
    ) : (
        <AddressesWithUser
            user={user}
            allowAddressDeletion={allowAddressDeletion ?? false}
            hasDescription={hasDescription}
            hasAccessToBYOE={hasAccessToBYOE}
        />
    );
};

export default Addresses;
