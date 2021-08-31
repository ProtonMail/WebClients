import useUserSettings from './useUserSettings';
import useMnemonicOperationStatus from './useMnemonicOperationStatus';
import RecoveryStatus from '../containers/recovery/RecoveryStatus';
import usePrimaryRecoverySecret from './usePrimaryRecoverySecret';

const useRecoveryStatus = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const hasVerifiedRecoveryEmailAddress = !!userSettings?.Email?.Reset && !!userSettings?.Email?.Value;
    const hasRecoveryPhoneNumber = !!userSettings?.Phone?.Reset && !!userSettings?.Phone?.Value;

    const primaryRecoverySecret = usePrimaryRecoverySecret();
    const hasCurrentRecoveryFile = primaryRecoverySecret !== undefined;
    const mnemonicOperationStatus = useMnemonicOperationStatus();

    const accountRecoveryStatus: RecoveryStatus =
        hasVerifiedRecoveryEmailAddress || hasRecoveryPhoneNumber ? 'complete' : 'incomplete';
    const dataRecoveryStatus: RecoveryStatus =
        mnemonicOperationStatus.accountRecovery || hasCurrentRecoveryFile ? 'complete' : 'incomplete';

    return [
        {
            accountRecoveryStatus,
            dataRecoveryStatus,
        },
        loadingUserSettings || !userSettings,
    ] as const;
};

export default useRecoveryStatus;
