import { APP_NAMES, APPS, APPS_CONFIGURATION } from '../constants';
import isTruthy from '../helpers/isTruthy';
import { stripLeadingAndTrailingSlash } from '../helpers/string';
import { getLocalIDPath } from '../authentication/pathnameHelper';

export const getAppHref = (to: string, toApp: APP_NAMES, localID?: number) => {
    const { subdomain: targetSubdomain } = APPS_CONFIGURATION[toApp];

    const { hostname, protocol } = window.location;
    const secondLevelDomain = hostname.substr(hostname.indexOf('.') + 1);
    const targetDomain = [targetSubdomain, secondLevelDomain].filter(isTruthy).join('.');

    const path = [
        targetDomain,
        stripLeadingAndTrailingSlash(''),
        getLocalIDPath(localID),
        stripLeadingAndTrailingSlash(to),
    ]
        .filter(isTruthy)
        .join('/');

    return `${protocol}//${path}`;
};

export const getAppHrefBundle = (to: string, toApp: APP_NAMES) => {
    const path = [APPS_CONFIGURATION[toApp].publicPath, to]
        .map(stripLeadingAndTrailingSlash)
        .filter(isTruthy)
        .join('/');
    return `/${path}`;
};

export const getAccountSettingsApp = () => APPS.PROTONACCOUNT;

export const getClientID = (appName: APP_NAMES) => {
    return APPS_CONFIGURATION[appName].clientID;
};
export const getAppName = (appName: APP_NAMES) => {
    return APPS_CONFIGURATION[appName].name;
};
