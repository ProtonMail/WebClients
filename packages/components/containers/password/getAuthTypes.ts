import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { getHasFIDO2Enabled, getHasTOTPEnabled } from '@proton/shared/lib/settings/twoFactor';
import { getHasFIDO2Support } from '@proton/shared/lib/webauthn/helper';

export const getAuthTypes = ({
    scope,
    infoResult,
    app,
    userSettings,
}: {
    scope: 'locked' | 'password';
    infoResult: InfoAuthedResponse | undefined;
    userSettings: UserSettings | undefined;
    app: APP_NAMES;
}) => {
    // locked scope doesn't require 2fa
    const enabled = scope === 'locked' ? 0 : (infoResult?.['2FA']?.Enabled ?? userSettings?.['2FA']?.Enabled) || 0;
    const hasTOTPEnabled = getHasTOTPEnabled(enabled);
    const hasFido2Enabled = getHasFIDO2Support(app, location.hostname) && getHasFIDO2Enabled(enabled);

    return { totp: hasTOTPEnabled, fido2: hasFido2Enabled, twoFactor: hasFido2Enabled || hasTOTPEnabled };
};
