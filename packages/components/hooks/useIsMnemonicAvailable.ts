import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { APPS } from '@proton/shared/lib/constants';
import useConfig from './useConfig';
import { FeatureCode } from '../containers/features';
import useAddresses from './useAddresses';
import useFeature from './useFeature';
import useUser from './useUser';

const { PROTONVPN_SETTINGS } = APPS;

const useIsMnemonicAvailable = () => {
    const { APP_NAME } = useConfig();
    const [user, loadingUser] = useUser();
    const mnemonicFeature = useFeature(FeatureCode.Mnemonic);

    const [addresses = [], loadingAddresses] = useAddresses();
    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);

    const isNonPrivateUser = !user?.isPrivate;
    const isMnemonicAvailable =
        !!mnemonicFeature.feature?.Value && hasMigratedKeys && !isNonPrivateUser && APP_NAME !== PROTONVPN_SETTINGS;

    return [isMnemonicAvailable, loadingAddresses || loadingUser] as const;
};

export default useIsMnemonicAvailable;
