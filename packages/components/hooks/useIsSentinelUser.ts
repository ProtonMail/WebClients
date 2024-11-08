import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { MNEMONIC_STATUS, SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

import useIsMnemonicAvailable from './useIsMnemonicAvailable';

const useIsSentinelUser = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [isMnemonicAvailable, loadingIsMnemonicAvailable] = useIsMnemonicAvailable();
    const [user] = useUser();

    const isSentinelUser = userSettings?.HighSecurity?.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

    const hasEmail = !!userSettings?.Email?.Value;
    const hasEmailVerified = !!userSettings?.Email?.Status;
    const hasEmailEnabled = !!userSettings?.Email?.Reset;
    const hasPhone = !!userSettings?.Phone?.Value;
    const hasPhoneVerified = !!userSettings?.Phone?.Status;
    const hasPhoneEnabled = !!userSettings?.Phone?.Reset;

    const hasVerifiedandDisabledEmail = hasEmail && hasEmailVerified && !hasEmailEnabled;
    const hasVerifiedandDisabledPhone = hasPhone && hasPhoneVerified && !hasPhoneEnabled;
    const hasRecoveryMethod = hasVerifiedandDisabledEmail || hasVerifiedandDisabledPhone;
    const hasMnemonic = isMnemonicAvailable && user.MnemonicStatus === MNEMONIC_STATUS.SET;

    const getSentinelRecoveryStatus = () => {
        if (isSentinelUser && hasMnemonic && hasRecoveryMethod) {
            return 'complete';
        }
        if (isSentinelUser && hasMnemonic) {
            return 'intermediate';
        }
        if (isSentinelUser && !hasMnemonic && ((hasEmail && hasEmailEnabled) || (hasPhone && hasPhoneEnabled))) {
            return 'insecure';
        }

        return 'incomplete';
    };

    const sentinelRecoveryStatus = getSentinelRecoveryStatus();
    return [
        {
            isSentinelUser,
            sentinelRecoveryStatus,
            hasMnemonic,
        },
        loadingUserSettings || !userSettings || loadingIsMnemonicAvailable,
    ] as const;
};

export default useIsSentinelUser;
