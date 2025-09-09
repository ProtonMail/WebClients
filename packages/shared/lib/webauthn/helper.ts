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
    return appName === APPS.PROTONACCOUNT && !hostname.endsWith('.onion');
};
