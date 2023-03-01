import { getRecoverySecrets } from '@proton/shared/lib/recoveryFile/recoveryFile';

import { useUser } from './useUser';

const useRecoverySecrets = () => {
    const [{ Keys }] = useUser();
    return getRecoverySecrets(Keys);
};

export default useRecoverySecrets;
