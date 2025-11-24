import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getIsMnemonicAvailable } from '@proton/shared/lib/mnemonic';

const useIsMnemonicAvailable = () => {
    const [user, loadingUser] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();

    const isMnemonicAvailable = getIsMnemonicAvailable({ addresses, user });

    return [isMnemonicAvailable, loadingAddresses || loadingUser] as const;
};

export default useIsMnemonicAvailable;
