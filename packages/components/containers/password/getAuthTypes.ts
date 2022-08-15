import { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { UserSettings } from '@proton/shared/lib/interfaces';
import { getHasFIDO2Enabled, getHasTOTPEnabled } from '@proton/shared/lib/settings/twoFactor';

export const getAuthTypes = (info: InfoAuthedResponse | undefined, userSettings: UserSettings, app: APP_NAMES) => {
    const Enabled = info?.['2FA']?.Enabled || userSettings?.['2FA']?.Enabled || 0;
    const hasTOTPEnabled = getHasTOTPEnabled(Enabled);
    const hasFido2Enabled = getHasFIDO2Enabled(Enabled) && app === APPS.PROTONACCOUNT;

    return { totp: hasTOTPEnabled, fido2: hasFido2Enabled, twoFactor: hasFido2Enabled || hasTOTPEnabled };
};
