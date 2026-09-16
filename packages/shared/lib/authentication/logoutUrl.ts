import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@protontech/crypto/utils';

import isEnumValue from '@proton/utils/isEnumValue';

import { getAppHref } from '../apps/helper';
import { getAppFromPathnameSafe, getSlugFromApp } from '../apps/slugHelper';
import type { APP_NAMES } from '../constants';
import { APPS, SSO_PATHS } from '../constants';
import { AccessType } from './accessType';
import { ForkSearchParameters } from './fork';
import type { ExtraSessionForkData } from './interface';
import type {
    LegacySerializedSignoutUserData,
    ParsedSignoutUserData,
    SerializedSignoutUserData,
    SignoutActionOptions,
    SignoutUserData,
} from './logoutInterface';
import { stripLocalBasenameFromPathname } from './pathnameHelper';

const clearRecoveryParam = 'clear-recovery';

/** Everything that has ever been serialized into this URL, since any of it can still arrive. */
type AnySerializedSignoutUserData = Partial<SerializedSignoutUserData> &
    Partial<LegacySerializedSignoutUserData> & { id: string };

/**
 * Only reached for a URL from a client that predates the local id, where the access type was the
 * only way to say which session was meant.
 * TODO: Drop with the `a` written into the `iaas` cookie in `accountSessions/storage.ts` once every
 * app is deployed with the local id. `findPersistedSessionByAccessType`,
 * `LegacySerializedSignoutUserData` and `SerializedSignoutUserData['a']` all go with it.
 */
const getAccessType = (session: AnySerializedSignoutUserData): AccessType => {
    // (legacy) self access type value
    if (session.s !== undefined) {
        return session.s ? AccessType.Self : AccessType.AdminAccess;
    }
    // (legacy) access type value
    if (session.a !== undefined && isEnumValue(session.a, AccessType)) {
        return session.a;
    }
    return AccessType.Self;
};

const parseSessions = (sessions: string | null) => {
    try {
        const result = JSON.parse(
            uint8ArrayToUtf8String(Uint8Array.fromBase64(sessions || '', { alphabet: 'base64url' }))
        );
        if (Array.isArray(result)) {
            // Can't sign out from more than this
            if (result.length > 50) {
                return [];
            }
            return result.map((session: AnySerializedSignoutUserData): ParsedSignoutUserData => {
                if (Number.isInteger(session.l)) {
                    return { id: session.id, localID: session.l as number };
                }
                return { id: session.id, accessType: getAccessType(session) };
            });
        }
        return [];
    } catch (e) {
        return [];
    }
};

const serializeSessions = (sessions: SignoutUserData[]): string => {
    return utf8StringToUint8Array(
        JSON.stringify(sessions.map((session): SerializedSignoutUserData => ({ l: session.localID, id: session.id })))
    ).toBase64({ alphabet: 'base64url', omitPadding: true });
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

export const getLocalAccountLogoutUrl = ({
    localID,
    extra,
}: {
    appName: APP_NAMES;
    localID: number;
    extra?: ExtraSessionForkData;
}) => {
    const url = new URL(window.location.href);
    url.pathname = stripLocalBasenameFromPathname(url.pathname);
    if (localID !== undefined) {
        url.searchParams.set(ForkSearchParameters.LocalID, `${localID}`);
    }
    if (extra?.email) {
        url.searchParams.set('email', extra.email);
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
