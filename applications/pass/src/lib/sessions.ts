import { clearUserLocalData } from 'proton-pass-web/lib/storage';

import type { EncryptedAuthSession } from '@proton/pass/lib/auth/session';
import { authStore, decodeUserData } from '@proton/pass/lib/auth/store';
import type { SwitchableSession } from '@proton/pass/lib/auth/switch';
import type { Maybe } from '@proton/pass/types/utils';
import { first } from '@proton/pass/utils/array/first';
import { sortOn } from '@proton/pass/utils/fp/sort';
import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

export const getSessionKey = (localId?: number) => `${STORAGE_PREFIX}${localId ?? 0}`;
export const getStateKey = (state: string) => `f${state}`;
export const getLocalIDFromSessionKey = (key: string) => parseInt(key.replace(STORAGE_PREFIX, ''), 10);

export const getPersistedSession = (localID: Maybe<number>) => {
    const encryptedSession = localStorage.getItem(getSessionKey(localID));
    if (!encryptedSession) return null;

    try {
        const persistedSession = JSON.parse(encryptedSession);
        return authStore.validPersistedSession(persistedSession) ? persistedSession : null;
    } catch {
        return null;
    }
};

export const getPersistedLocalIDsForUserID = (UserID: string): number[] =>
    Object.keys(localStorage)
        .filter((key) => {
            if (!key.startsWith(STORAGE_PREFIX)) return false;
            try {
                const data = localStorage.getItem(key);
                if (!data) return false;
                const session = JSON.parse(data);
                return session.UserID === UserID;
            } catch {
                return false;
            }
        })
        .map((key) => parseInt(key.replace(STORAGE_PREFIX, ''), 10));

/** NOTE: as a side-effect this will wipe any user-data if
 * an invalid persisted session is detected. */
export const getPersistedSessions = (): EncryptedAuthSession[] =>
    Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .reduce<EncryptedAuthSession[]>((sessions, key) => {
            try {
                const rawSession = localStorage.getItem(key)!;
                const encryptedSession = JSON.parse(rawSession);

                if (!authStore.validPersistedSession(encryptedSession)) throw new Error('Invalid persisted session');
                sessions.push(encryptedSession);
            } catch (err) {
                const localID = getLocalIDFromSessionKey(key);
                clearUserLocalData(localID);
            }

            return sessions;
        }, []);

export const getSwitchableSessions = (): SwitchableSession[] =>
    getPersistedSessions().map<SwitchableSession>((encryptedSession) => {
        const { userData, LocalID, lastUsedAt } = encryptedSession;
        const { PrimaryEmail = '', DisplayName = '' } = userData ? decodeUserData(userData) : {};

        return {
            DisplayName,
            lastUsedAt,
            LocalID: LocalID!,
            PrimaryEmail,
            UID: encryptedSession.UID,
            UserID: encryptedSession.UserID,
        };
    });

/** Resolves the most recent used localID */
export const getDefaultLocalID = (sessions: EncryptedAuthSession[]): Maybe<number> =>
    first(sessions.sort(sortOn('lastUsedAt')))?.LocalID;
