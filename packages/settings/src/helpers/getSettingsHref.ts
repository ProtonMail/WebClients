import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

/**
 * Get the correct settings href for each app
 * Pass has its own settings page, other apps use the account settings
 */
export const getSettingsHref = (appName: APP_NAMES, localID?: number): string => {
    if (appName === APPS.PROTONPASS) {
        return getAppHref('/settings', APPS.PROTONPASS, localID);
    }
    return getAppHref(`/${getSlugFromApp(appName)}`, APPS.PROTONACCOUNT, localID);
};
