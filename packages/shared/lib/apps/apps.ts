import { APPS, APP_NAMES } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { User } from '../interfaces';
import { getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';

export const getPublicUserProtonAddressApps = (): APP_NAMES[] => {
    return [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE];
};

export const getSSOVPNOnlyAccountApps = (): APP_NAMES[] => {
    return [APPS.PROTONVPN_SETTINGS];
};

export const getAvailableApps = (user?: User) => {
    if (getIsSSOVPNOnlyAccount(user)) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsPublicUserWithoutProtonAddress(user)) {
        return getPublicUserProtonAddressApps();
    }
    if (isElectronApp) {
        return [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
    }
    return [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE, APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS];
};
