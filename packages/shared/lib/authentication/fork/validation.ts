import type { APP_NAMES } from '../../constants';
import { APPS, APPS_CONFIGURATION } from '../../constants';
import { validateEmailAddress } from '../../helpers/email';
import { decodeBase64URL, stringToUint8Array } from '../../helpers/encoding';
import { ExtraSessionForkSearchParameters, ForkSearchParameters, ForkType, ForkableApps } from './constants';

export const getValidatedApp = (app = ''): APP_NAMES | undefined => {
    if (ForkableApps.has(app as any)) {
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
    if (/^\d+$/.test(localID)) {
        const maybeLocalID = Number(localID);
        if (Number.isInteger(maybeLocalID) && maybeLocalID >= 0 && maybeLocalID <= 100000000) {
            return maybeLocalID;
        }
    }
};

export const getLocalIDForkSearchParameter = (searchParams: URLSearchParams) => {
    const localID = searchParams.get(ForkSearchParameters.LocalID) || '';
    return getValidatedLocalID(localID);
};

export const getValidatedRawKey = (str: string) => {
    try {
        return stringToUint8Array(decodeBase64URL(str));
    } catch (e: any) {
        return undefined;
    }
};
export const getValidatedForkType = (str: string) => {
    if (Object.values(ForkType).includes(str as ForkType)) {
        return str as ForkType;
    }
};

export const getEmailSessionForkSearchParameter = (searchParams: URLSearchParams) => {
    const email = searchParams.get(ExtraSessionForkSearchParameters.Email) || '';
    if (validateEmailAddress(email)) {
        return email.toLowerCase();
    }
};
