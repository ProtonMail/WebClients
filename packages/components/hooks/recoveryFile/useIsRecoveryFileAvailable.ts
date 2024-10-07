import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getIsRecoveryFileAvailable } from '@proton/shared/lib/recoveryFile/recoveryFile';

import useConfig from '../useConfig';
import { useUserKeys } from '../useUserKeys';

const useIsRecoveryFileAvailable = () => {
    const [user, loadingUser] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const [userKeys = [], loadingUserKeys] = useUserKeys();
    const { APP_NAME } = useConfig();

    const isRecoveryFileAvailable = getIsRecoveryFileAvailable({
        user,
        addresses,
        userKeys,
        appName: APP_NAME,
    });

    return [isRecoveryFileAvailable, loadingUserKeys || loadingAddresses || loadingUser] as const;
};

export default useIsRecoveryFileAvailable;
