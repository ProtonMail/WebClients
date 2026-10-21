import { APPS, type APP_NAMES } from '../constants';
import type { User } from '../interfaces/User';
import { getAppNameSetFromProductSet } from '../organization/accessControl/serialization';

export const getForbiddenApps = (user?: User): Set<APP_NAMES> => {
    if (!user) {
        return new Set();
    }

    return getAppNameSetFromProductSet(new Set(user.ForbiddenProducts));
};

export const appSupportsSSO = (appName?: APP_NAMES): boolean => {
    if (!appName) {
        return false;
    }

    return [APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS, APPS.PROTONLUMO].some((ssoPlanName) => ssoPlanName === appName);
};
