import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';

import type RecoveryStatus from '../containers/recovery/RecoveryStatus';
import usePrimaryRecoverySecret from './usePrimaryRecoverySecret';

const useRecoveryStatus = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const hasVerifiedRecoveryEmailAddress = !!userSettings?.Email?.Reset && !!userSettings?.Email?.Value;
    const hasRecoveryPhoneNumber = !!userSettings?.Phone?.Reset && !!userSettings?.Phone?.Value;

    const primaryRecoverySecret = usePrimaryRecoverySecret();
    const hasCurrentRecoveryFile = primaryRecoverySecret !== undefined;

    const accountRecoveryStatus: RecoveryStatus =
        hasVerifiedRecoveryEmailAddress || hasRecoveryPhoneNumber ? 'complete' : 'incomplete';

    const mnemonicIsSet = user.MnemonicStatus === MNEMONIC_STATUS.SET;
    const dataRecoveryStatus: RecoveryStatus = mnemonicIsSet || hasCurrentRecoveryFile ? 'complete' : 'incomplete';

    return [
        {
            accountRecoveryStatus,
            dataRecoveryStatus,
            mnemonicIsSet,
        },
        loadingUserSettings || !userSettings,
    ] as const;
};

export default useRecoveryStatus;
