import { useUser } from '@proton/account/user/hooks';
import { getHasOutdatedRecoveryFile } from '@proton/shared/lib/recoveryFile/recoveryFile';

const useHasOutdatedRecoveryFile = () => {
    const [{ Keys }] = useUser();
    return getHasOutdatedRecoveryFile(Keys);
};

export default useHasOutdatedRecoveryFile;
