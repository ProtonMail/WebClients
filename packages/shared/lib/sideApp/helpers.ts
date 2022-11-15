import { isURLProtonInternal } from '@proton/components/helpers/url';

import { getAppHref } from '../apps/helper';
import { getLocalIDFromPathname } from '../authentication/pathnameHelper';
import { APPS, APPS_CONFIGURATION, APP_NAMES } from '../constants';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from './models';

const { PROTONMAIL, PROTONCALENDAR } = APPS;

const sideAppAuthorizedApps = [
    APPS_CONFIGURATION[PROTONMAIL].subdomain,
    APPS_CONFIGURATION[PROTONCALENDAR].subdomain,
] as string[];

export const isAuthorizedSideAppUrl = (url: string) => {
    const originURL = new URL(url);

    // Get subdomain of the url => e.g. mail, calendar, drive
    const appFromUrl = originURL.hostname.split('.')[0];

    return isURLProtonInternal(url) && sideAppAuthorizedApps.includes(appFromUrl);
};

export const getIsAuthorizedApp = (appName: string): appName is APP_NAMES => {
    const authorizedApps: string[] = [APPS.PROTONMAIL, APPS.PROTONCALENDAR];
    return authorizedApps.includes(appName);
};

export const getIsSideAppPostMessage = (event: MessageEvent) => {
    const origin = event.origin;

    /**
     * The message is a "valid" side app message if
     * - The message is coming from an authorized app
     * - event.data is defined
     * - event.data.type is part of the SIDE_APP_EVENT enum
     */
    return !(
        !isAuthorizedSideAppUrl(origin) ||
        !event.data ||
        !Object.values(SIDE_APP_EVENTS).includes(event.data.type)
    );
};

export const postMessageFromIframe = (message: SIDE_APP_ACTION, parentApp: APP_NAMES) => {
    if (!getIsAuthorizedApp(parentApp)) {
        return;
    }
    const parentUrl = getAppHref('/', parentApp, getLocalIDFromPathname(window.location.pathname));

    window.parent?.postMessage(message, parentUrl);
};

export const postMessageToIframe = (message: SIDE_APP_ACTION, iframedApp: APP_NAMES) => {
    if (!getIsAuthorizedApp(iframedApp)) {
        return;
    }
    const iframe = document.getElementById('side-app') as HTMLIFrameElement | null;
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
