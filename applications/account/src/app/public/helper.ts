import { APPS, APPS_CONFIGURATION, APP_NAMES } from '@proton/shared/lib/constants';

export const getToAppName = (toApp?: APP_NAMES) => {
    if (!toApp || toApp === APPS.PROTONACCOUNT) {
        return '';
    }

    return APPS_CONFIGURATION[toApp]?.name || '';
};

export const getHasAppExternalSignup = (toApp?: APP_NAMES) => {
    return [APPS.PROTONVPN_SETTINGS].includes(toApp as any);
};

export const defaultPersistentKey = 'default-persistent';
