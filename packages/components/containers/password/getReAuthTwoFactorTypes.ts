import type { InfoAuthedResponse } from '@proton/shared/lib/authentication/interface';
import { getTwoFactorTypes } from '@proton/shared/lib/authentication/twoFactor';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';

/**
 * Get two-factor types based on scope and infoResult for a signed-in user.
 */
export const getReAuthTwoFactorTypes = ({
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
    return getTwoFactorTypes({ enabled, app, hostname: location.hostname });
};
