import { APPS, APPS_CONFIGURATION, APP_NAMES } from '@proton/shared/lib/constants';

export const getToAppName = (toApp?: APP_NAMES) => {
    if (!toApp || toApp === APPS.PROTONACCOUNT) {
        return '';
    }

    return APPS_CONFIGURATION[toApp]?.name || '';
};

export const requiresProtonAccount: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONCONTACTS, APPS.PROTONCALENDAR];

export const requiresNonDelinquent: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
];

export const externalApps = [APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE];

export const getHasAppExternalSignup = (toApp?: APP_NAMES) => {
    return externalApps.includes(toApp as any);
};

export const defaultPersistentKey = 'default-persistent';
