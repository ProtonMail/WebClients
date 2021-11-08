import useUser from './useUser';
import { useUserKeys } from './useUserKeys';
import { useAddressesKeys } from './useAddressesKeys';
import {
    getAllKeysReactivationRequests,
    getKeysToReactivateCount,
} from '../containers/keys/reactivateKeys/getAllKeysToReactive';

const useCanReactivateKeys = () => {
    const [User] = useUser();
    const [addressesKeys, loadingAddressesKeys] = useAddressesKeys();
    const [userKeys, loadingUserKeys] = useUserKeys();

    if (loadingAddressesKeys || loadingUserKeys) {
        return false;
    }

    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, User, userKeys);
    const numberOfKeysToReactivate = getKeysToReactivateCount(allKeysToReactivate);

    const { isSubUser } = User;
    const hasDecryptedUserKeys = userKeys?.length > 0;

    const canReactivateKeys = !isSubUser && numberOfKeysToReactivate > 0 && hasDecryptedUserKeys;

    return canReactivateKeys;
};

export default useCanReactivateKeys;
