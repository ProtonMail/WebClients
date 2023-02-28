import { getPrimaryRecoverySecret } from '@proton/shared/lib/recoveryFile/recoveryFile';

import { useUser } from './useUser';

const usePrimaryRecoverySecret = () => {
    const [{ Keys }] = useUser();
    return getPrimaryRecoverySecret(Keys);
};

export default usePrimaryRecoverySecret;
