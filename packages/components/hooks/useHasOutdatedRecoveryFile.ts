import usePrimaryRecoverySecret from './usePrimaryRecoverySecret';
import useRecoverySecrets from './useRecoverySecrets';

const useHasOutdatedRecoveryFile = () => {
    const primaryRecoverySecret = usePrimaryRecoverySecret();
    const recoverySecrets = useRecoverySecrets();
    return recoverySecrets?.length > 0 && !primaryRecoverySecret;
};

export default useHasOutdatedRecoveryFile;
