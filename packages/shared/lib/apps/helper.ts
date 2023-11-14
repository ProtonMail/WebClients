import window from '@proton/shared/lib/window';
import isTruthy from '@proton/utils/isTruthy';

import { getLocalIDPath, stripLocalBasenameFromPathname } from '../authentication/pathnameHelper';
import { APPS, APPS_CONFIGURATION, APP_NAMES, EXTENSIONS, VPN_HOSTNAME } from '../constants';
import { isMac, isWindows } from '../helpers/browser';
import { isElectronApp } from '../helpers/desktop';
import { stripLeadingAndTrailingSlash } from '../helpers/string';

interface TargetLocation {
    hostname: string;
    protocol: string;
    port: string;
}

const getSSOAppTargetLocation = (location: TargetLocation = window.location): TargetLocation => {
    if (location.hostname === VPN_HOSTNAME) {
        return {
            hostname: 'proton.me',
            protocol: 'https:',
            port: '',
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
    const { hostname, protocol, port } = getSSOAppTargetLocation(targetLocation);
    const lastIndex = hostname.lastIndexOf('.');
    const secondLevelIndex = hostname.indexOf('.');
    // If there's no second level, just use the original hostname. NOTE: Does not work for tlds as .co.uk
    const secondLevelDomain = lastIndex !== secondLevelIndex ? hostname.substr(secondLevelIndex + 1) : hostname;
    const targetDomain = [targetSubdomain, secondLevelDomain].filter(isTruthy).join('.');
    const targetPort = port.length > 0 ? `:${port}` : '';

    const path = [
        targetDomain + targetPort,
        stripLeadingAndTrailingSlash(''),
        getLocalIDPath(localID),
        stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(to)),
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
    const config = APPS_CONFIGURATION[appName];
    const isElectron = isElectronApp();

    let apiClientID = config.webClientID ?? config.clientID ?? '';
    if (isElectron) {
        if (isWindows()) {
            apiClientID = config.windowsClientID ?? apiClientID;
        } else if (isMac()) {
            apiClientID = config.macosClientID ?? apiClientID;
        }
    }

    return apiClientID;
};

export const getExtension = (appName: APP_NAMES) => {
    return EXTENSIONS[appName as keyof typeof EXTENSIONS];
};

export const getAppName = (appName: APP_NAMES) => {
    return APPS_CONFIGURATION[appName].name;
};

export const getAppShortName = (appName: APP_NAMES) => {
    return APPS_CONFIGURATION[appName].bareName;
};

export const getInvoicesPathname = () => {
    return '/dashboard#invoices';
};
