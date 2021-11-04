import { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';
import { useUser } from './useUser';

const usePrimaryRecoverySecret = (): KeyWithRecoverySecret | undefined => {
    const [user] = useUser();
    const primaryUserKey = user?.Keys?.[0];

    if (!primaryUserKey?.RecoverySecret || !primaryUserKey?.RecoverySecretSignature) {
        return;
    }

    return primaryUserKey as KeyWithRecoverySecret;
};

export default usePrimaryRecoverySecret;
