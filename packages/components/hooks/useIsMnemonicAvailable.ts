import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsMnemonicAvailable } from '@proton/shared/lib/mnemonic';

import useConfig from './useConfig';
import useUser from './useUser';

const useIsMnemonicAvailable = () => {
    const { APP_NAME } = useConfig();
    const [user, loadingUser] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();

    const isMnemonicAvailable = getIsMnemonicAvailable({ addresses, user, app: APP_NAME });

    return [isMnemonicAvailable, loadingAddresses || loadingUser] as const;
};

export default useIsMnemonicAvailable;
