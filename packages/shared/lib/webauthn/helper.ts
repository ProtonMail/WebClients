import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { getHasWebAuthnSupport } from '@proton/shared/lib/helpers/browser';

export const getHasFIDO2Support = (appName: APP_NAMES, hostname: string) => {
    // Explicitly not testing the production domain for test domain support
    return (
        appName === APPS.PROTONACCOUNT &&
        !hostname.endsWith('.onion') &&
        !hostname.endsWith('.protonmail.com') &&
        getHasWebAuthnSupport()
    );
};
