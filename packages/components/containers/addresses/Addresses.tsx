import { useAllowAddressDeletion } from '@proton/account/allowAddressDeletion/hooks';
import { useUser } from '@proton/account/user/hooks';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import EasySwitchStoreProvider from '@proton/activation/src/logic/StoreProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';

import AddressesWithMembers from './AddressesWithMembers';
import AddressesWithUser from './AddressesWithUser';

interface AddressesProps {
    isOnlySelf?: boolean;
    organization?: Organization;
    memberID?: string;
    hasDescription?: boolean;
    hasAccessToBYOE?: boolean;
    app?: APP_NAMES;
}

const Addresses = ({ isOnlySelf, organization, memberID, hasDescription, hasAccessToBYOE, app }: AddressesProps) => {
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
                        app={app}
                    />
                ) : (
                    <AddressesWithUser
                        app={app}
                        user={user}
                        allowAddressDeletion={allowAddressDeletion ?? false}
                        hasDescription={hasDescription}
                        hasAccessToBYOE={hasAccessToBYOE}
                    />
                )}
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>
    );
};

export default Addresses;
