import type { UserSettings } from '../interfaces';
import { SETTINGS_PROTON_SENTINEL_STATE } from '../interfaces';

export const isProtonSentinelEligible = (userSettings: UserSettings) => {
    return (
        !!userSettings.HighSecurity.Eligible ||
        userSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED
    );
};
