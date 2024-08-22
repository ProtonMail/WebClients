import type { APP_NAMES } from '../constants';
import { APPS } from '../constants';
import { isElectronApp } from '../helpers/desktop';
import type { User } from '../interfaces';
import { getIsPublicUserWithoutProtonAddress, getIsSSOVPNOnlyAccount } from '../keys';

type AppContext = 'dropdown' | 'app';

export const getPublicUserProtonAddressApps = (context: AppContext): APP_NAMES[] => {
    const result: APP_NAMES[] = [APPS.PROTONPASS, APPS.PROTONVPN_SETTINGS, APPS.PROTONDRIVE];

    // Proton Docs is never shown in the dropdown context, but we still need it in this list to ensure it's an allowed app.
    if (context === 'app') {
        result.push(APPS.PROTONDOCS);
    }

    return result;
};

export const getSSOVPNOnlyAccountApps = (): APP_NAMES[] => {
    return [APPS.PROTONVPN_SETTINGS];
};

export const getAvailableApps = (options: { user?: User; context: AppContext }) => {
    if (getIsSSOVPNOnlyAccount(options.user)) {
        return getSSOVPNOnlyAccountApps();
    }
    if (getIsPublicUserWithoutProtonAddress(options.user)) {
        return getPublicUserProtonAddressApps(options.context);
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
