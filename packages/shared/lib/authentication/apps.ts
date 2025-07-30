import { DEFAULT_APP } from '@proton/shared/lib/apps/slugHelper';
import type { User } from '@proton/shared/lib/interfaces';
import { getIsExternalAccount, getIsSSOVPNOnlyAccount, getIsVPNOnlyAccount } from '@proton/shared/lib/keys';

import type { APP_NAMES } from '../constants';
import { APPS, APPS_CONFIGURATION, CLIENT_TYPES, PRODUCT_BIT } from '../constants';

export const getToAppName = (toApp?: APP_NAMES) => {
    if (!toApp || toApp === APPS.PROTONACCOUNT) {
        return '';
    }

    return APPS_CONFIGURATION[toApp]?.name || '';
};

export const vpnApps = [APPS.PROTONVPN_SETTINGS, APPS.PROTONVPNBROWSEREXTENSION];
export const passApps = [APPS.PROTONPASS, APPS.PROTONEXTENSION, APPS.PROTONPASSBROWSEREXTENSION];

export const externalApps = [...vpnApps, APPS.PROTONDRIVE, ...passApps];

export const requiresProtonAddress: APP_NAMES[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
export const requiresAddress: APP_NAMES[] = [...requiresProtonAddress, APPS.PROTONDRIVE, ...passApps];

export const requiresNonDelinquent: APP_NAMES[] = [
    APPS.PROTONMAIL,
    APPS.PROTONCONTACTS,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
];

export const getHasAppExternalSignup = (toApp?: APP_NAMES) => {
    return externalApps.includes(toApp as any);
};

export const getIsPassApp = (toApp?: APP_NAMES) => {
    return passApps.includes(toApp as any);
};

export const getIsVPNApp = (toApp?: APP_NAMES, clientType?: CLIENT_TYPES) => {
    return vpnApps.includes(toApp as any) || clientType === CLIENT_TYPES.VPN;
};

export const getIsMailApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONMAIL;
};
export const getIsCalendarApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONCALENDAR;
};
export const getIsDriveApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONDRIVE;
};
export const getIsDocsApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONDOCS;
};
export const getIsWalletApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONWALLET;
};
export const getIsLumoApp = (toApp?: APP_NAMES) => {
    return toApp === APPS.PROTONLUMO;
};

export const getRequiresAddress = (toApp: APP_NAMES) => {
    return requiresAddress.includes(toApp);
};

export const getRequiresProtonAddress = (toApp: APP_NAMES) => {
    return requiresProtonAddress.includes(toApp);
};

export const getToApp = (toApp: APP_NAMES | undefined, user: User) => {
    if (toApp) {
        return toApp;
    }
    if (getIsSSOVPNOnlyAccount(user) || getIsVPNOnlyAccount(user)) {
        return APPS.PROTONVPN_SETTINGS;
    }
    if (getIsExternalAccount(user)) {
        const { Subscribed } = user;

        if (Subscribed === PRODUCT_BIT.VPN) {
            return APPS.PROTONVPN_SETTINGS;
        }

        if (Subscribed === PRODUCT_BIT.PASS) {
            return APPS.PROTONPASS;
        }

        // VPN and Pass bundle
        if (Subscribed === (PRODUCT_BIT.VPN | PRODUCT_BIT.PASS)) {
            return APPS.PROTONVPN_SETTINGS;
        }

        return APPS.PROTONDRIVE;
    }
    return DEFAULT_APP;
};

export const getToAppFromSubscribed = (user: User) => {
    const list = [
        { bit: PRODUCT_BIT.MAIL, app: APPS.PROTONMAIL },
        { bit: PRODUCT_BIT.DRIVE, app: APPS.PROTONDRIVE },
        { bit: PRODUCT_BIT.VPN | PRODUCT_BIT.PASS, app: APPS.PROTONVPN_SETTINGS }, // VPN + Pass Bundle
        { bit: PRODUCT_BIT.PASS, app: APPS.PROTONPASS },
        { bit: PRODUCT_BIT.VPN, app: APPS.PROTONVPN_SETTINGS },
    ];
    return list.find(({ bit }) => {
        if (user.Subscribed === bit) {
            return true;
        }
    })?.app;
};
