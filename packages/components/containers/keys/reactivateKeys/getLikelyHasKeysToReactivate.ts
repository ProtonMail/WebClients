import { Address, User } from '@proton/shared/lib/interfaces';

const getLikelyHasKeysToReactivate = (user: User, addresses: Address[]) => {
    return (
        user?.Keys?.some((Key) => !Key.Active) || addresses?.some((address) => address.Keys?.some((Key) => !Key.Active))
    );
};

export default getLikelyHasKeysToReactivate;
