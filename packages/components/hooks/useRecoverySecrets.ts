import { useUser } from '@proton/account/user/hooks';
import { getRecoverySecrets } from '@proton/shared/lib/recoveryFile/recoveryFile';

const useRecoverySecrets = () => {
    const [{ Keys }] = useUser();
    return getRecoverySecrets(Keys);
};

export default useRecoverySecrets;
