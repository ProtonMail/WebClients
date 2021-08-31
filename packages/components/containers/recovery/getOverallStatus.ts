import RecoveryStatus from './RecoveryStatus';

interface Props {
    accountRecoveryStatus: RecoveryStatus;
    dataRecoveryStatus: RecoveryStatus;
    isDataRecoveryAvailable: boolean;
}

const getOverallStatus = ({
    accountRecoveryStatus,
    dataRecoveryStatus,
    isDataRecoveryAvailable,
}: Props): RecoveryStatus => {
    if (accountRecoveryStatus !== 'complete') {
        return 'incomplete';
    }

    if (isDataRecoveryAvailable && dataRecoveryStatus !== 'complete') {
        return 'intermediate';
    }

    return 'complete';
};

export default getOverallStatus;
