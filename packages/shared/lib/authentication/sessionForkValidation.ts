import { APPS, APPS_CONFIGURATION, APP_NAMES, FORKABLE_APPS } from '../constants';
import { decodeBase64URL, stringToUint8Array } from '../helpers/encoding';
import { FORK_TYPE } from './ForkInterface';

export const getValidatedApp = (app = ''): APP_NAMES | undefined => {
    if (FORKABLE_APPS.has(app as any)) {
        return app as APP_NAMES;
    }
    if (
        app.startsWith('proton-') &&
        app.match(/-/g)?.length === 1 &&
        /^[a-z-]+$/.test(app) &&
        app.length >= 10 &&
        app.length < 16
    ) {
        const protonAppName = app as APP_NAMES;
        if (APPS_CONFIGURATION[protonAppName]) {
            return;
        }
        const safeAppName = app.replace('proton-', '');
        APPS_CONFIGURATION[protonAppName] = Object.entries(APPS_CONFIGURATION[APPS.PROTONMAIL]).reduce(
            (acc, [key, value]) => {
                acc[key as keyof typeof acc] = value.replace('mail', safeAppName).replace('Mail', 'Account (internal)');
                return acc;
            },
            APPS_CONFIGURATION[APPS.PROTONMAIL]
        );
        return app as APP_NAMES;
    }
};

export const getValidatedLocalID = (localID = '') => {
    if (!localID) {
        return;
    }
    const maybeLocalID = parseInt(localID, 10);
    if (Number.isInteger(maybeLocalID) && maybeLocalID >= 0 && maybeLocalID <= 100000000) {
        return maybeLocalID;
    }
};

export const getValidatedRawKey = (str: string) => {
    try {
        return stringToUint8Array(decodeBase64URL(str));
    } catch (e: any) {
        return undefined;
    }
};
export const getValidatedForkType = (str: string) => {
    if (Object.values(FORK_TYPE).includes(str as FORK_TYPE)) {
        return str as FORK_TYPE;
    }
};
