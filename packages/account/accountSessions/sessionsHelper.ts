import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { ForkType, requestFork } from '@proton/shared/lib/authentication/fork';
import { APPS, type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';

export const getLoginHref = (appName: APP_NAMES) => {
    const href = getAppHref(SSO_PATHS.LOGIN, APPS.PROTONACCOUNT);
    const search = `?product=${getSlugFromApp(appName || APPS.PROTONMAIL)}&prompt=login`;
    return `${href}${search}`;
};

export const getSwitchHref = (appName: APP_NAMES) => {
    const href = getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT);
    const search = `?product=${getSlugFromApp(appName || APPS.PROTONMAIL)}`;
    return `${href}${search}`;
};

export const handleSwitchAccountFork = (appName: APP_NAMES, forkType = ForkType.SWITCH) => {
    return requestFork({
        fromApp: appName,
        forkType,
    });
};
