import { getIsMnemonicAvailable } from '../containers/mnemonic/helper';
import useAddresses from './useAddresses';
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
