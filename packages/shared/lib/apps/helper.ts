import { APP_NAMES, APPS, APPS_CONFIGURATION, VPN_HOSTNAME } from '../constants';
import isTruthy from '../helpers/isTruthy';
import { stripLeadingAndTrailingSlash } from '../helpers/string';
import { getLocalIDPath } from '../authentication/pathnameHelper';

interface TargetLocation {
    hostname: string;
    protocol: string;
}

const getSSOAppTargetLocation = (location: TargetLocation = window.location): TargetLocation => {
    if (location.hostname === VPN_HOSTNAME) {
        return {
            hostname: 'protonmail.com',
            protocol: 'https:',
        };
    }
    return location;
};

export const getAppHref = (
    to: string,
    toApp: APP_NAMES,
    localID?: number,
    targetLocation: TargetLocation = window.location
) => {
    const { subdomain: targetSubdomain } = APPS_CONFIGURATION[toApp];

    const { hostname, protocol } = getSSOAppTargetLocation(targetLocation);
    const lastIndex = hostname.lastIndexOf('.');
    const secondLevelIndex = hostname.indexOf('.');
    // If there's no second level, just use the original hostname. NOTE: Does not work for tlds as .co.uk
    const secondLevelDomain = lastIndex !== secondLevelIndex ? hostname.substr(secondLevelIndex + 1) : hostname;
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
