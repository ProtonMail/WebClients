import { APPS, APP_NAMES, APPS_CONFIGURATION } from 'proton-shared/lib/constants';

export const ALLOWED_APPS = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONCONTACTS,
    APPS.PROTONACCOUNT,
    APPS.PROTONVPN_SETTINGS,
];

export const ALLOWED_SLUGS = ALLOWED_APPS.map((app) => APPS_CONFIGURATION[app].settingsSlug);

export const getAppFromSlug = (slug: string): APP_NAMES => {
    const keys = Object.keys(APPS_CONFIGURATION);
    const i = Object.values(APPS_CONFIGURATION).findIndex(({ settingsSlug }) => slug === settingsSlug);

    return keys[i] as APP_NAMES;
};

export type AppSlug = typeof ALLOWED_SLUGS[number];
