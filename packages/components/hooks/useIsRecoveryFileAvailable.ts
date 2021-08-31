import { getHasMigratedAddressKeys, getPrimaryKey } from '@proton/shared/lib/keys';
import useAddresses from './useAddresses';
import useUser from './useUser';
import { useUserKeys } from './useUserKeys';
import useFeature from './useFeature';
import { FeatureCode } from '../containers/features';

const useIsRecoveryFileAvailable = () => {
    const [user, loadingUser] = useUser();
    const recoveryFileFeature = useFeature(FeatureCode.RecoveryFile);

    const [addresses = [], loadingAddresses] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    const [userKeys = [], loadingUserKeys] = useUserKeys();
    const primaryKey = getPrimaryKey(userKeys);

    const isNonPrivateSubUser = !user?.isPrivate && user?.isMember;
    const isRecoveryFileAvailable =
        !!recoveryFileFeature.feature?.Value && !!primaryKey?.privateKey && hasMigratedKeys && !isNonPrivateSubUser;

    return [isRecoveryFileAvailable, loadingUserKeys || loadingAddresses || loadingUser] as const;
};

export default useIsRecoveryFileAvailable;
