import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { User } from '../interfaces';
import { getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';

export const getPublicUserProtonAddressApps = (): APP_NAMES[] => {
    return [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE, APPS.PROTONDOCS];
};

export const getSSOVPNOnlyAccountApps = (): APP_NAMES[] => {
    return [APPS.PROTONVPN_SETTINGS];
};

export const getAvailableApps = (options: { user?: User }) => {
    if (getIsSSOVPNOnlyAccount(options.user)) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsPublicUserWithoutProtonAddress(options.user)) {
        return getPublicUserProtonAddressApps();
    }
    if (isElectronApp) {
        return [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
    }

    const apps: APP_NAMES[] = [
        APPS.PROTONMAIL,
        APPS.PROTONCALENDAR,
        APPS.PROTONDRIVE,
        APPS.PROTONVPN_SETTINGS,
        APPS.PROTONPASS,
        APPS.PROTONWALLET,
    ];

    return apps;
};
