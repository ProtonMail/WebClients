import { APPS } from '@proton/shared/lib/constants';
import { getHasMigratedAddressKeys, getPrimaryKey } from '@proton/shared/lib/keys';

import useAddresses from './useAddresses';
import useConfig from './useConfig';
import useUser from './useUser';
import { useUserKeys } from './useUserKeys';

const { PROTONVPN_SETTINGS } = APPS;

const useIsRecoveryFileAvailable = () => {
    const { APP_NAME } = useConfig();
    const [user, loadingUser] = useUser();

    const [addresses = [], loadingAddresses] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    const [userKeys = [], loadingUserKeys] = useUserKeys();
    const primaryKey = getPrimaryKey(userKeys);

    const isNonPrivateUser = !user?.isPrivate;
    const isRecoveryFileAvailable =
        !!primaryKey?.privateKey && hasMigratedKeys && !isNonPrivateUser && APP_NAME !== PROTONVPN_SETTINGS;

    return [isRecoveryFileAvailable, loadingUserKeys || loadingAddresses || loadingUser] as const;
};

export default useIsRecoveryFileAvailable;
