import { SETTINGS_PROTON_SENTINEL_STATE, UserSettings } from '../interfaces';

export const isProtonSentinelEligible = (userSettings: UserSettings) => {
    return (
        !!userSettings.HighSecurity.Eligible ||
        userSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED
    );
};
