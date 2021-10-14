import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { FeatureCode } from '../containers/features';
import { useAddresses } from './useAddresses';
import useFeature from './useFeature';
import useUser from './useUser';

const useIsMnemonicAvailable = (): boolean => {
    const [user] = useUser();
    const mnemonicFeature = useFeature(FeatureCode.Mnemonic);
    const [addresses = []] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    const isNonPrivateUser = !user?.isPrivate;

    return mnemonicFeature.feature?.Value && hasMigratedKeys && !isNonPrivateUser;
};

export default useIsMnemonicAvailable;
