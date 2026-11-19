import { useAllowAddressDeletion } from '@proton/account/allowAddressDeletion/hooks';
import { useUser } from '@proton/account/user/hooks';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import type { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization?: Organization;
    memberID?: string;
    hasDescription?: boolean;
    hasAccessToBYOE?: boolean;
    /** The card variant renders the buttons above a card holding the table. */
    variant?: SettingsLayoutVariant;
}

const Addresses = ({
    isOnlySelf,
    organization,
    memberID,
    hasDescription,
    hasAccessToBYOE,
    variant,
}: AddressesProps) => {
    const [user] = useUser();
    const [allowAddressDeletion] = useAllowAddressDeletion();

    return (
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                {user.isAdmin && user.hasPaidMail ? (
                    <AddressesWithMembers
                        isOnlySelf={isOnlySelf}
                        user={user}
                        memberID={memberID}
                        organization={organization}
                        allowAddressDeletion={allowAddressDeletion ?? false}
                        hasDescription={hasDescription}
                        hasAccessToBYOE={hasAccessToBYOE}
                        variant={variant}
                    />
                ) : (
                    <AddressesWithUser
                        user={user}
                        allowAddressDeletion={allowAddressDeletion ?? false}
                        hasDescription={hasDescription}
                        hasAccessToBYOE={hasAccessToBYOE}
                        variant={variant}
                    />
                )}
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>
    );
};

export default Addresses;
