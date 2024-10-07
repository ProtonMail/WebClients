import { useUser } from '@proton/account/user/hooks';
import { getPrimaryRecoverySecret } from '@proton/shared/lib/recoveryFile/recoveryFile';

const usePrimaryRecoverySecret = () => {
    const [{ Keys }] = useUser();
    return getPrimaryRecoverySecret(Keys);
};

export default usePrimaryRecoverySecret;
