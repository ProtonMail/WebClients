import { APPS, APPS_CONFIGURATION, APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';

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

export const vpnApps = [APPS.PROTONVPN_SETTINGS, APPS.PROTONVPNBROWSEREXTENSION];

export const externalApps = [...vpnApps, APPS.PROTONDRIVE, APPS.PROTONEXTENSION];

export const getHasAppExternalSignup = (toApp?: APP_NAMES) => {
    return externalApps.includes(toApp as any);
};

export const getIsVPNApp = (toApp?: APP_NAMES, clientType?: CLIENT_TYPES) => {
    return vpnApps.includes(toApp as any) || clientType === CLIENT_TYPES.VPN;
};

export const defaultPersistentKey = 'default-persistent';
