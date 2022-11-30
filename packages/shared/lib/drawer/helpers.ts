import { Feature } from '@proton/components/containers';
import { isURLProtonInternal } from '@proton/components/helpers/url';

import { getAppHref } from '../apps/helper';
import { getLocalIDFromPathname } from '../authentication/pathnameHelper';
import { APPS, APPS_CONFIGURATION, APP_NAMES } from '../constants';
import { DrawerFeatureFlag } from '../interfaces/Drawer';
import { DRAWER_ACTION, DRAWER_APPS, DRAWER_EVENTS } from './interfaces';

const { PROTONMAIL, PROTONCALENDAR, PROTONDRIVE } = APPS;

const drawerAuthorizedApps = [
    APPS_CONFIGURATION[PROTONMAIL].subdomain,
    APPS_CONFIGURATION[PROTONCALENDAR].subdomain,
    APPS_CONFIGURATION[PROTONDRIVE].subdomain,
] as string[];

export const getIsNativeDrawerApp = (app: APP_NAMES): app is DRAWER_APPS => {
    const nativeApps: APP_NAMES[] = [APPS.PROTONCONTACTS];

    return nativeApps.includes(app);
};

export const getIsIframedDrawerApp = (app: APP_NAMES): app is DRAWER_APPS => {
    const iframedApps: APP_NAMES[] = [APPS.PROTONCALENDAR];

    return iframedApps.includes(app);
};

export const getIsDrawerApp = (app: APP_NAMES): app is DRAWER_APPS => {
    return getIsNativeDrawerApp(app) || getIsIframedDrawerApp(app);
};

export const isAuthorizedDrawerUrl = (url: string) => {
    const originURL = new URL(url);

    // Get subdomain of the url => e.g. mail, calendar, drive
    const appFromUrl = originURL.hostname.split('.')[0];

    return isURLProtonInternal(url) && drawerAuthorizedApps.includes(appFromUrl);
};

export const getIsAuthorizedApp = (appName: string): appName is APP_NAMES => {
    const authorizedApps: string[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE];
    return authorizedApps.includes(appName);
};

export const getIsDrawerPostMessage = (event: MessageEvent): event is MessageEvent<DRAWER_ACTION> => {
    const origin = event.origin;

    /**
     * The message is a "valid" side app message if
     * - The message is coming from an authorized app
     * - event.data is defined
     * - event.data.type is part of the SIDE_APP_EVENT enum
     */
    return !(!isAuthorizedDrawerUrl(origin) || !event.data || !Object.values(DRAWER_EVENTS).includes(event.data.type));
};

export const postMessageFromIframe = (message: DRAWER_ACTION, parentApp: APP_NAMES) => {
    if (!getIsAuthorizedApp(parentApp)) {
        return;
    }
    const parentUrl = getAppHref('/', parentApp, getLocalIDFromPathname(window.location.pathname));

    window.parent?.postMessage(message, parentUrl);
};

export const postMessageToIframe = (message: DRAWER_ACTION, iframedApp: APP_NAMES) => {
    if (!getIsAuthorizedApp(iframedApp)) {
        return;
    }
    const iframe = document.getElementById('drawer-app-iframe') as HTMLIFrameElement | null;
    const targetOrigin = getAppHref('/', iframedApp, getLocalIDFromPathname(window.location.pathname));

    iframe?.contentWindow?.postMessage(message, targetOrigin);
};

export const addParentAppToUrl = (url: string, currentApp: APP_NAMES, replacePath = true) => {
    const targetUrl = new URL(url);
    const splitPathname = targetUrl.pathname.split('/').filter((el) => el !== '');

    const currentAppSubdomain = APPS_CONFIGURATION[currentApp].subdomain;

    // splitPathname[0] & splitPathname[1] corresponds to the user local id /u/localID
    // splitPathname[2] should be the parentApp name
    // If we find parentApp, we don't need to add it to the pathname
    if (splitPathname[2] !== currentAppSubdomain) {
        // In some cases, we want to replace completely this param (e.g. Calendar "view" parameter needs to be mail instead of week)
        if (replacePath) {
            splitPathname.splice(2, 1, currentAppSubdomain);
        } else {
            splitPathname.splice(2, 0, currentAppSubdomain);
        }

        targetUrl.pathname = splitPathname.join('/');
    }

    return targetUrl.href;
};

export const getDisplayContactsInDrawer = (app: APP_NAMES, drawerFeature?: Feature<DrawerFeatureFlag>) => {
    if (app === APPS.PROTONMAIL) {
        return drawerFeature?.Value.ContactsInMail;
    } else if (app === APPS.PROTONCALENDAR) {
        return drawerFeature?.Value.ContactsInCalendar;
    } else if (app === APPS.PROTONDRIVE) {
        return drawerFeature?.Value.ContactsInDrive;
    }

    return undefined;
};
