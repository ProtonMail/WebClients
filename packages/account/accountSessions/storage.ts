import { type PersistedSessionLite, SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import {
    getMinimalPersistedSession,
    getPersistedSessions,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { decodeBase64URL, encodeBase64URL } from '@proton/shared/lib/helpers/encoding';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import isTruthy from '@proton/utils/isTruthy';

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
          s: 0 | 1;
      }
    | number;

const toItem = (value: PersistedSessionLite): SerializedItem => {
    if (!value.isSelf) {
        return { l: value.localID, s: 0 };
    }
    return value.localID;
};

const fromItem = (value: any): PersistedSessionLite | undefined => {
    if (Number.isInteger(value)) {
        return { localID: value, isSelf: true };
    }
    if ('l' in value && 's' in value) {
        return { localID: Number(value.l), isSelf: Boolean(value.s) };
    }
};

const to = (value: PersistedSessionLite[]) => {
    return encodeBase64URL(JSON.stringify(value.map(toItem)));
};

const from = (value: string | undefined): PersistedSessionLite[] | undefined => {
    try {
        if (!value) {
            return;
        }
        const parsedValue = JSON.parse(decodeBase64URL(value));
        if (!Array.isArray(parsedValue)) {
            return;
        }
        const parsedArray = parsedValue.map(fromItem).filter(isTruthy);
        if (parsedArray.length) {
            return parsedArray;
        }
    } catch (e) {}
};

export const writeAccountSessions = () => {
    const sessions = getPersistedSessions()
        // Remove oauth sessions, we don't want them to be visible in the in-app account switcher
        .filter((session) => session.source !== SessionSource.Oauth)
        .map(getMinimalPersistedSession);
    syncToCookie(to(sessions));
};

export const readAccountSessions = () => {
    const cookieValue = getCookie(cookieName);
    return from(cookieValue);
};
