import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

/**
 * If the browser supports WebAuthn credentials.
 */
export const getHasWebAuthnSupport = () => {
    try {
        return !!navigator?.credentials?.create;
    } catch (e) {
        return false;
    }
};

/**
 * If the application supports FIDO2 and the domain is not onion.
 */
export const getHasFIDO2Support = ({ appName, hostname }: { appName: APP_NAMES; hostname: string }) => {
    // Explicitly not testing the production domain for test domain support
    return (appName === APPS.PROTONACCOUNT || appName === APPS.PROTONADMIN) && !hostname.endsWith('.onion');
};

export const assertFIDO2Support = ({
    app,
    hostname,
    twoFactor: { totp, fido2 },
}: {
    app: APP_NAMES;
    hostname: string;
    twoFactor: { totp: boolean; fido2: boolean };
}) => {
    // If totp is enabled, we don't need to check for FIDO2 support since TOTP can always be used.
    if (totp) {
        return true;
    }

    // However, if totp is disabled and fido2 is enabled, we need to check for FIDO2 support.
    // For example, it's not supported on account.protonvpn.com atm.
    if (fido2) {
        if (!getHasWebAuthnSupport()) {
            throw new Error('WebAuthn support is not available on this device');
        }
        if (!getHasFIDO2Support({ appName: app, hostname })) {
            throw new Error('Security key sign-in is not supported on this application');
        }
    }
};
