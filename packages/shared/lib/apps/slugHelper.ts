import { stripLocalBasenameFromPathname } from '../authentication/pathnameHelper';
import { APPS, APPS_CONFIGURATION, APP_NAMES } from '../constants';
import { stripLeadingAndTrailingSlash } from '../helpers/string';

export const DEFAULT_APP = APPS.PROTONMAIL;

export const ALLOWED_APPS = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONCONTACTS,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONDRIVE,
    APPS.PROTONPASS,
    APPS.PROTONDOCS,
];

export const getSlugFromApp = (app: APP_NAMES) => APPS_CONFIGURATION[app].settingsSlug;

export const getAppFromPathname = (pathname: string): APP_NAMES | undefined => {
    return ALLOWED_APPS.find((appName) => {
        const slug = getSlugFromApp(appName);
        // Expects a trimmed string
        return pathname.match(`^${slug}(/|$)`);
    });
};

export const getAppFromHostname = (hostname: string): APP_NAMES | undefined => {
    return ALLOWED_APPS.find((appName) => {
        const slug = getSlugFromApp(appName);
        return hostname.match(`^${slug}\.`);
    });
};

export const getAppFromPathnameSafe = (pathname: string) => {
    const trimmedPathname = stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(pathname));
    return getAppFromPathname(trimmedPathname);
};

export const ALLOWED_SLUGS = ALLOWED_APPS.map((app) => APPS_CONFIGURATION[app].settingsSlug);

export type AppSlug = (typeof ALLOWED_SLUGS)[number];

export const stripSlugFromPathname = (pathname: string) => {
    return pathname.replace(new RegExp(`/(${ALLOWED_SLUGS.join('|')})`), '');
};
