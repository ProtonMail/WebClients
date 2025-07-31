import { LOCALSTORAGE_DRAWER_KEY } from '@proton/shared/lib/drawer/constants';
import { getMessageEventType } from '@proton/shared/lib/helpers/messageEvent';
import { isURLProtonInternal } from '@proton/shared/lib/helpers/url';

import { getAppHref } from '../apps/helper';
import { getLocalIDFromPathname } from '../authentication/pathnameHelper';
import type { APP_NAMES } from '../constants';
import { APPS, APPS_CONFIGURATION } from '../constants';
import window from '../window';
import type { DRAWER_ACTION, DrawerApp } from './interfaces';
import { DRAWER_EVENTS, DRAWER_NATIVE_APPS } from './interfaces';

const { PROTONMAIL, PROTONCALENDAR, PROTONDRIVE } = APPS;
export const drawerAuthorizedApps = [
    APPS_CONFIGURATION[PROTONMAIL].subdomain,
    APPS_CONFIGURATION[PROTONCALENDAR].subdomain,
    APPS_CONFIGURATION[PROTONDRIVE].subdomain,
] as string[];

export const authorizedApps: string[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE];

export const drawerNativeApps: DrawerApp[] = Object.values(DRAWER_NATIVE_APPS);
export const drawerIframeApps: DrawerApp[] = [APPS.PROTONCALENDAR];

export const getLocalStorageUserDrawerKey = (userID: string) => `${LOCALSTORAGE_DRAWER_KEY}-${userID}`;

export const getIsNativeDrawerApp = (app: string): app is DrawerApp => {
    const tsDrawerNativeApps: string[] = [...drawerNativeApps];

    return tsDrawerNativeApps.includes(app);
};

export const getIsIframedDrawerApp = (app: string): app is DrawerApp & APP_NAMES => {
    const tsDrawerIframeApps: string[] = [...drawerIframeApps];

    return tsDrawerIframeApps.includes(app);
};

export const getIsDrawerApp = (app: string): app is DrawerApp => {
    return getIsNativeDrawerApp(app) || getIsIframedDrawerApp(app);
};

export const isAuthorizedDrawerUrl = (url: string, hostname: string) => {
    try {
        const originURL = new URL(url);

        // Get subdomain of the url => e.g. mail, calendar, drive
        const appFromUrl = originURL.hostname.split('.')[0];

        return isURLProtonInternal(url, hostname) && drawerAuthorizedApps.includes(appFromUrl);
    } catch {
        // the URL constructor will throw if no URL can be built out of url
        return false;
    }
};

export const getIsAuthorizedApp = (appName: string): appName is APP_NAMES => {
    return authorizedApps.includes(appName);
};

export const getIsDrawerPostMessage = (
    event: MessageEvent,
    hostname = window.location.hostname
): event is MessageEvent<DRAWER_ACTION> => {
    const origin = event.origin;

    // sandboxed iframes might have a "null" origin instead of a valid one
    // so we need to handle this case, otherwise we will get an error
    if (!origin || origin === 'null') {
        return false;
    }

    // Defensive code to prevent the "Permission denied to access property 'type'" error
    const eventType = getMessageEventType(event);
    if (!eventType) {
        return false;
    }

    /**
     * The message is a "valid" side app message if
     * - The message is coming from an authorized app
     * - event.data is defined
     * - event.data.type is part of the SIDE_APP_EVENT enum
     */
    const isAuthorized = isAuthorizedDrawerUrl(origin, hostname);
    const isValidType = Object.values(DRAWER_EVENTS).includes(eventType as DRAWER_EVENTS);

    return isAuthorized && isValidType;
};

export const postMessageFromIframe = (message: DRAWER_ACTION, parentApp: APP_NAMES, location = window.location) => {
    if (!getIsAuthorizedApp(parentApp)) {
        return;
    }
    const parentUrl = getAppHref('/', parentApp, getLocalIDFromPathname(location.pathname), location);

    window.parent?.postMessage(message, parentUrl);
};

export const postMessageToIframe = (message: DRAWER_ACTION, iframedApp: DrawerApp, location = window.location) => {
    if (!getIsAuthorizedApp(iframedApp)) {
        return;
    }
    const iframe = document.querySelector('[id^=drawer-app-iframe]') as HTMLIFrameElement | null;
    const targetOrigin = getAppHref('/', iframedApp, getLocalIDFromPathname(location.pathname), location);

    iframe?.contentWindow?.postMessage(message, targetOrigin);
};

/**
 *  Allow to add the parent app in a URL we will open in the Drawer
 *  From the child application, we need to know who is the parent. For that, we add it in the URL we want to open
 *  Depending on the case you might want to replace path or not
 *
 *  - "replacePath === true": You want to replace the path by the app
 *      e.g. url = "https://calendar.proton.pink/u/0/event?Action=VIEW&EventID=eventID&RecurrenceID=1670835600" and currentApp = "proton-mail"
 *        ==> https://calendar.proton.pink/u/0/mail?Action=VIEW&EventID=eventID&RecurrenceID=1670835600
 *        "event" has been replaced by "mail"
 *  - "replacePath === false": You want to add your app to the path
 *      e.g. url = "https://calendar.proton.pink/u/0/something" and currentApp = "proton-mail"
 *        ==> "https://calendar.proton.pink/u/0/mail/something"
 *        "mail" has been added to the path
 */
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

export const getDisplayContactsInDrawer = (app: APP_NAMES) => {
    return app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR || app === APPS.PROTONDRIVE;
};

export const getDisplaySettingsInDrawer = (app: APP_NAMES) => {
    return app === APPS.PROTONMAIL || app === APPS.PROTONCALENDAR || app === APPS.PROTONDRIVE;
};

export const getDisplaySecurityCenterInDrawer = (app: APP_NAMES) => {
    return app === APPS.PROTONMAIL;
};

export const closeDrawerFromChildApp = (parentApp: APP_NAMES, currentApp: APP_NAMES, closeDefinitely?: boolean) => {
    if (!getIsIframedDrawerApp(currentApp)) {
        throw new Error('Cannot close non-iframed app');
    }

    postMessageFromIframe(
        {
            type: DRAWER_EVENTS.CLOSE,
            payload: { app: currentApp, closeDefinitely },
        },
        parentApp
    );
};

export const isAppInView = (currentApp: DrawerApp, appInView?: DrawerApp) => {
    return appInView ? appInView === currentApp : false;
};

export const getDisplayDrawerApp = (currentApp: APP_NAMES, toOpenApp: DrawerApp) => {
    if (toOpenApp === APPS.PROTONCALENDAR) {
        return currentApp === APPS.PROTONMAIL || currentApp === APPS.PROTONDRIVE;
    } else if (toOpenApp === DRAWER_NATIVE_APPS.CONTACTS) {
        return getDisplayContactsInDrawer(currentApp);
    } else if (toOpenApp === DRAWER_NATIVE_APPS.QUICK_SETTINGS) {
        return getDisplaySettingsInDrawer(currentApp);
    } else if (toOpenApp === DRAWER_NATIVE_APPS.SECURITY_CENTER) {
        return getDisplaySecurityCenterInDrawer(currentApp);
    }
};

export const getDrawerAppFromURL = (url: string) => {
    if (!isAuthorizedDrawerUrl(url, window.location.hostname)) {
        return;
    }

    const originURL = new URL(url);

    // Get subdomain of the url => e.g. mail, calendar, drive
    const subdomainFromUrl = originURL.hostname.split('.')[0];

    const appName = Object.keys(APPS_CONFIGURATION).find((app) => {
        return APPS_CONFIGURATION[app as APP_NAMES].subdomain === subdomainFromUrl;
    });

    return appName as DrawerApp;
};
