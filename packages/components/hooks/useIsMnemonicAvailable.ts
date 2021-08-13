import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { FeatureCode } from '../containers/features';
import { useAddresses } from './useAddresses';
import useFeature from './useFeature';

const useIsMnemonicAvailable = (): boolean => {
    const mnemonicFeature = useFeature(FeatureCode.Mnemonic);
    const [addresses = []] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    return mnemonicFeature.feature?.Value && hasMigratedKeys;
};

export default useIsMnemonicAvailable;
