import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { useUser } from './useUser';

const useMnemonicOperationStatus = () => {
    const [user] = useUser();

    return {
        // Mnemonic contains latest user key and can be used for full account recovery
        accountRecovery: user.MnemonicStatus === MNEMONIC_STATUS.SET,
        // Mnemonic may not contain latest user key and should only be used for limited data recovery
        dataRecovery: user.MnemonicStatus === MNEMONIC_STATUS.SET || user.MnemonicStatus === MNEMONIC_STATUS.OUTDATED,
    };
};

export default useMnemonicOperationStatus;
