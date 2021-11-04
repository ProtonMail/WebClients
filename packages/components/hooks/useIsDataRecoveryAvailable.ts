import useIsRecoveryFileAvailable from './useIsRecoveryFileAvailable';
import useIsMnemonicAvailable from './useIsMnemonicAvailable';

const useIsDataRecoveryAvailable = () => {
    const [isRecoveryFileAvailable, loadingIsRecoveryFileAvailable] = useIsRecoveryFileAvailable();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();

    const isDataRecoveryAvailable = isRecoveryFileAvailable || isMnemonicAvailable;

    return [isDataRecoveryAvailable, loadingIsRecoveryFileAvailable || loadingIsMnemonicAvailable];
};

export default useIsDataRecoveryAvailable;
