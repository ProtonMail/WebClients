import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import useUserSettings from './useUserSettings';
import RecoveryStatus from '../containers/recovery/RecoveryStatus';
import usePrimaryRecoverySecret from './usePrimaryRecoverySecret';
import { useUser } from './useUser';

const useRecoveryStatus = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const hasVerifiedRecoveryEmailAddress = !!userSettings?.Email?.Reset && !!userSettings?.Email?.Value;
    const hasRecoveryPhoneNumber = !!userSettings?.Phone?.Reset && !!userSettings?.Phone?.Value;

    const primaryRecoverySecret = usePrimaryRecoverySecret();
    const hasCurrentRecoveryFile = primaryRecoverySecret !== undefined;

    const accountRecoveryStatus: RecoveryStatus =
        hasVerifiedRecoveryEmailAddress || hasRecoveryPhoneNumber ? 'complete' : 'incomplete';
    const dataRecoveryStatus: RecoveryStatus =
        user.MnemonicStatus === MNEMONIC_STATUS.SET || hasCurrentRecoveryFile ? 'complete' : 'incomplete';

    return [
        {
            accountRecoveryStatus,
            dataRecoveryStatus,
        },
        loadingUserSettings || !userSettings,
    ] as const;
};

export default useRecoveryStatus;
