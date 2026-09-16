import { uint8ArrayToUtf8String, utf8StringToUint8Array } from '@protontech/crypto/utils';

import {
    type PersistedSessionCookieData,
    type PersistedSessionLite,
    SessionSource,
} from '@proton/shared/lib/authentication/SessionInterface';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import {
    getMinimalPersistedSession,
    getPersistedSessions,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getAccessTypeFromMask } from '@proton/shared/lib/authentication/sessionAccessType';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

/**
 * Sessions belong to the device, so `auth/v4/sessions/local` answers for the whole device and can
 * name sessions this client no longer has. For example non-persistent sessions cookies go when the
 * browser closes, but the API keeps reporting it. The response may therefore contain false positives.
 *
 * Only account knows the complete list of sessions so it publishes the local ids it currently knows
 * on the second level domain where every subdomain can read them.
 */
const cookieName = 'iaas';

const syncToCookie = (cookieValue: string) => {
    setCookie({
        cookieName: cookieName,
        cookieValue,
        cookieDomain: getSecondLevelDomain(window.location.hostname),
        path: '/',
        expirationDate: 'max',
    });
};

type SerializedItem =
    | {
          l: number;
          a: AccessType;
      }
    | number;

/**
 * Written for clients that read the access type from this cookie rather than from
 * `auth/v4/sessions/local`.
 * TODO: Drop with the legacy read in `logoutUrl.ts` once every app is deployed with the mask - that
 * one is the read old writers need, this is the write old readers need, and both end together.
 */
const toItem = (value: PersistedSessionCookieData): SerializedItem => {
    const accessType = getAccessTypeFromMask(value.accessTypeMask);
    if (accessType === AccessType.Self) {
        return value.localID;
    }
    return {
        l: value.localID,
        a: accessType,
    };
};

/**
 * Only the local id is read back. The access type is read from `auth/v4/sessions/local`.
 */
const fromItem = (value: any): PersistedSessionLite | undefined => {
    if (Number.isInteger(value)) {
        return { localID: value };
    }
    if (Number.isInteger(value?.l)) {
        return { localID: value.l };
    }
};

const to = (value: PersistedSessionCookieData[]) => {
    return utf8StringToUint8Array(JSON.stringify(value.map(toItem))).toBase64({
        alphabet: 'base64url',
        omitPadding: true,
    });
};

const from = (value: string | undefined): PersistedSessionLite[] | undefined => {
    try {
        if (!value) {
            return;
        }
        const parsedValue = JSON.parse(uint8ArrayToUtf8String(Uint8Array.fromBase64(value, { alphabet: 'base64url' })));
        if (!Array.isArray(parsedValue)) {
            return;
        }
        const parsedArray = parsedValue.map(fromItem).filter(isTruthy);
        if (parsedArray.length) {
            return parsedArray;
        }
    } catch (e) {}
};

export const writeAccountSessions = (persistedSessions = getPersistedSessions()) => {
    const sessions = persistedSessions
        // Only want Proton and Saml sessions in the account switcher. Ignore Oauth and Msp.
        .filter((session) => [SessionSource.Proton, SessionSource.Saml].some((source) => source === session.source))
        .map(getMinimalPersistedSession);
    syncToCookie(to(sessions));
};

export const readAccountSessions = () => {
    const cookieValue = getCookie(cookieName);
    return from(cookieValue);
};

/**
 * The purpose of this function is to extend the lifetime of the iaas cookie.
 * It rewrites whatever value it currently has so that the expiration increases.
 * This is important because browsers cap the maximum expiration of a cookie, where
 * certain browsers like brave or safari cap them at 7 days.
 */
export const updateAccountSessions = () => {
    const cookieValue = getCookie(cookieName);
    if (!cookieValue) {
        return false;
    }
    syncToCookie(cookieValue);
    return true;
};
