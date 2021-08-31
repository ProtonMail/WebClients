import useRecoveryStatus from './useRecoveryStatus';
import useIsDataRecoveryAvailable from './useIsDataRecoveryAvailable';
import getOverallStatus from '../containers/recovery/getOverallStatus';

const useShowRecoveryNotification = () => {
    const [{ accountRecoveryStatus, dataRecoveryStatus }, loadingRecoveryStatus] = useRecoveryStatus();
    const [isDataRecoveryAvailable, loadingIsDataRecoveryAvailable] = useIsDataRecoveryAvailable();

    const overallStatus = getOverallStatus({ accountRecoveryStatus, dataRecoveryStatus, isDataRecoveryAvailable });
    return !loadingRecoveryStatus && !loadingIsDataRecoveryAvailable && overallStatus !== 'complete';
};

export default useShowRecoveryNotification;
