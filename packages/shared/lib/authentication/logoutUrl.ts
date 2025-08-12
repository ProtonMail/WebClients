import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { decodeBase64URL, encodeBase64URL } from '@proton/shared/lib/helpers/encoding';
import isEnumValue from '@proton/utils/isEnumValue';

import { ForkSearchParameters } from './fork';
import type {
    LegacySerializedSignoutUserData,
    SerializedSignoutUserData,
    SignoutActionOptions,
    SignoutUserData,
} from './logoutInterface';
import { stripLocalBasenameFromPathname } from './pathnameHelper';

const clearRecoveryParam = 'clear-recovery';

const getAccessType = (session: SerializedSignoutUserData | LegacySerializedSignoutUserData) => {
    // Legacy value
    if ('s' in session) {
        return session.s ? AccessType.Self : AccessType.AdminAccess;
    } else if ('a' in session) {
        if (isEnumValue(session.a, AccessType)) {
            return session.a;
        }
    }
    return AccessType.Self;
};

const parseSessions = (sessions: string | null) => {
    try {
        const result = JSON.parse(decodeBase64URL(sessions || ''));
        if (Array.isArray(result)) {
            // Can't sign out from more than this
            if (result.length > 50) {
                return [];
            }
            return result.map(
                (session: SerializedSignoutUserData | LegacySerializedSignoutUserData): SignoutUserData => {
                    return {
                        id: session.id,
                        accessType: getAccessType(session),
                    };
                }
            );
        }
        return [];
    } catch (e) {
        return [];
    }
};

const serializeSessions = (sessions: SignoutUserData[]): string => {
    return encodeBase64URL(
        JSON.stringify(
            sessions.map(
                (session): Omit<SerializedSignoutUserData, 's'> => ({
                    id: session.id,
                    a: session.accessType,
                })
            )
        )
    );
};

export const parseLogoutURL = (url: URL) => {
    const searchParams = new URLSearchParams(url.search);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const sessions = parseSessions(hashParams.get('sessions'));
    const reason = searchParams.get('reason') || searchParams.get('flow');
    const type = searchParams.get('type') === 'all' ? 'all' : 'self';
    return {
        logout: reason === 'signout' || reason === 'logout',
        clearDeviceRecoveryData: searchParams.get(clearRecoveryParam) === 'true',
        sessions,
        type,
    };
};

const addLogoutUrlParameters = (url: URL, options: SignoutActionOptions) => {
    if (options.reason) {
        url.searchParams.set('reason', options.reason);
    }
    if (options.clearDeviceRecovery) {
        url.searchParams.set(clearRecoveryParam, JSON.stringify(true));
    }
    if (options.users) {
        const hashParams = new URLSearchParams();
        hashParams.set('sessions', serializeSessions(options.users));
        url.hash = hashParams.toString();
    }
    if (options.type) {
        url.searchParams.set('type', options.type);
    }
};

export const getStandaloneLogoutURL = ({ options }: { options: SignoutActionOptions }) => {
    const url = new URL(SSO_PATHS.LOGIN, window.location.origin);
    addLogoutUrlParameters(url, options);
    return url.toString();
};

const getProduct = (appName: APP_NAMES, pathname: string) => {
    if (appName === APPS.PROTONACCOUNT) {
        return getAppFromPathnameSafe(pathname);
    }
    return getSlugFromApp(appName);
};

export const getLocalAccountLogoutUrl = ({ localID }: { appName: APP_NAMES; localID: number }) => {
    const url = new URL(window.location.href);
    url.pathname = stripLocalBasenameFromPathname(url.pathname);
    if (localID !== undefined) {
        url.searchParams.set(ForkSearchParameters.LocalID, `${localID}`);
    }
    return url.toString();
};

export const getLogoutURL = ({ appName, options }: { appName: APP_NAMES; options: SignoutActionOptions }) => {
    const url = new URL(getAppHref(SSO_PATHS.SWITCH, APPS.PROTONACCOUNT));
    const product = getProduct(appName, window.location.pathname);
    if (product) {
        url.searchParams.set('product', product);
    }
    addLogoutUrlParameters(url, options);
    return url.toString();
};
