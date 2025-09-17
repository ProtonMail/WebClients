import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { hasBit } from '../helpers/bitset';
import { SETTINGS_2FA_ENABLED } from '../interfaces';
import { getHasWebAuthnSupport } from '../webauthn/helper';

/**
 * If the application supports FIDO2 and the domain is not onion.
 */
export const getHasFIDO2Support = ({ appName, hostname }: { appName: APP_NAMES; hostname: string }) => {
    // Explicitly not testing the production domain for test domain support
    return (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONADMIN) && !hostname.endsWith('.onion');
};

const getTwoFactorSupport = (app: APP_NAMES, hostname: string) => {
    const fido2 = {
        application: getHasFIDO2Support({ appName: app, hostname }),
        webAuthnSupport: getHasWebAuthnSupport(),
    };
    return {
        fido2: {
            ...fido2,
            supported: fido2.application && fido2.webAuthnSupport,
        },
    };
};

const assertTwoFactorSupport = ({
    twoFactorSupport,
    twoFactor: { totp, fido2, enabled },
}: {
    twoFactorSupport: ReturnType<typeof getTwoFactorSupport>;
    twoFactor: { totp: boolean; fido2: boolean; enabled: boolean };
}) => {
    // If totp is enabled, we don't need to check for FIDO2 support since TOTP can always be used.
    if (totp) {
        return;
    }

    // However, if totp is disabled and fido2 is enabled, we need to check for FIDO2 support.
    // For example, it's not supported on account.protonvpn.com atm.
    if (fido2) {
        if (!twoFactorSupport.fido2.application) {
            throw new Error('Security key sign-in is not supported on this application');
        }
        if (!twoFactorSupport.fido2.webAuthnSupport) {
            throw new Error('WebAuthn support is not available on this device');
        }
    }

    // If two-factor is enabled but neither totp nor fido2 is enabled, it's a two-factor method that is not known to this client.
    if (enabled && !totp && !fido2) {
        throw new Error('Unsupported two-factor method enabled');
    }
};

export const getHasAnyTwoFactorEnabled = (Enabled?: number) => {
    return (Enabled || 0) > 0;
};

export const getHasTOTPEnabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.OTP);
};

export const getHasFIDO2Enabled = (Enabled?: number) => {
    return hasBit(Enabled || 0, SETTINGS_2FA_ENABLED.FIDO2);
};

export const getTwoFactorTypes = ({
    enabled,
    app,
    hostname,
}: {
    enabled: number;
    app: APP_NAMES;
    hostname: string;
}) => {
    const result = {
        totp: getHasTOTPEnabled(enabled),
        fido2: getHasFIDO2Enabled(enabled),
        enabled: getHasAnyTwoFactorEnabled(enabled),
    };

    const twoFactorSupport = getTwoFactorSupport(app, hostname);
    assertTwoFactorSupport({ twoFactor: result, twoFactorSupport });

    return {
        ...result,
        // Filter the fido2 type again since the assertion will pass in case totp is enabled.
        // This ensures the fido2 method will get hidden in the UI.
        fido2: result.fido2 && twoFactorSupport.fido2.supported,
    };
};
