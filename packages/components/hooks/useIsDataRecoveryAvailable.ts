import useIsMnemonicAvailable from './useIsMnemonicAvailable';
import useIsRecoveryFileAvailable from './useIsRecoveryFileAvailable';

const useIsDataRecoveryAvailable = () => {
    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const isDataRecoveryAvailable = isRecoveryFileAvailable || isMnemonicAvailable;

    return [isDataRecoveryAvailable, loadingIsRecoveryFileAvailable || loadingIsMnemonicAvailable];
};

export default useIsDataRecoveryAvailable;
