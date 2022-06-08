import isTruthy from '@proton/util/isTruthy';
import { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';
import { useUser } from './useUser';

const useRecoverySecrets = (): KeyWithRecoverySecret[] => {
    const [{ Keys = [] }] = useUser();
    return Keys.map((key) => {
        if (!key?.RecoverySecret || !key?.RecoverySecretSignature) {
            return;
        }

        return key as KeyWithRecoverySecret;
    }).filter(isTruthy);
};

export default useRecoverySecrets;
