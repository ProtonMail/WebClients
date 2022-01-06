import { getHasMigratedAddressKeys, getPrimaryKey } from '@proton/shared/lib/keys';
import { APPS } from '@proton/shared/lib/constants';
import useConfig from './useConfig';
import useAddresses from './useAddresses';
import useUser from './useUser';
import { useUserKeys } from './useUserKeys';
import useFeature from './useFeature';
import { FeatureCode } from '../containers/features';

const { PROTONVPN_SETTINGS } = APPS;

const useIsRecoveryFileAvailable = () => {
    const { APP_NAME } = useConfig();
    const [user, loadingUser] = useUser();
    const recoveryFileFeature = useFeature(FeatureCode.RecoveryFile);

    const [addresses = [], loadingAddresses] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    const [userKeys = [], loadingUserKeys] = useUserKeys();
    const primaryKey = getPrimaryKey(userKeys);

    const isNonPrivateUser = !user?.isPrivate;
    const isRecoveryFileAvailable =
        !!recoveryFileFeature.feature?.Value &&
        !!primaryKey?.privateKey &&
        hasMigratedKeys &&
        !isNonPrivateUser &&
        APP_NAME !== PROTONVPN_SETTINGS;

    return [isRecoveryFileAvailable, loadingUserKeys || loadingAddresses || loadingUser] as const;
};

export default useIsRecoveryFileAvailable;
