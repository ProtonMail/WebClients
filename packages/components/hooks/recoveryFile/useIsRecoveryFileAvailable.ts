import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { getIsRecoveryFileAvailable } from '@proton/shared/lib/recoveryFile/recoveryFile';

const useIsRecoveryFileAvailable = () => {
    const [user, loadingUser] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const [userKeys = [], loadingUserKeys] = useUserKeys();

    const isRecoveryFileAvailable = getIsRecoveryFileAvailable({
        user,
        addresses,
        userKeys,
    });

    return [isRecoveryFileAvailable, loadingUserKeys || loadingAddresses || loadingUser] as const;
};

export default useIsRecoveryFileAvailable;
