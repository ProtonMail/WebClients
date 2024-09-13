import { authStore, decodeUserData } from '@proton/pass/lib/auth/store';
import type { SwitchableSession } from '@proton/pass/lib/auth/switch';
import type { Maybe } from '@proton/pass/types/utils';
import { STORAGE_PREFIX } from '@proton/shared/lib/authentication/persistedSessionStorage';

export const getSessionKey = (localId?: number) => `${STORAGE_PREFIX}${localId ?? 0}`;
export const getStateKey = (state: string) => `f${state}`;

export const getDefaultLocalID = (): Maybe<number> => {
    const defaultKey = Object.keys(localStorage).find((key) => key.startsWith(STORAGE_PREFIX));
    if (defaultKey) return parseInt(defaultKey.replace(STORAGE_PREFIX, ''), 10);
};

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

export const getPersistedSessionsForUserID = (UserID: string): string[] =>
    Object.keys(localStorage).filter((key) => {
        if (!key.startsWith(STORAGE_PREFIX)) return false;
        try {
            const data = localStorage.getItem(key);
            if (!data) return false;
            const session = JSON.parse(data);
            return session.UserID === UserID;
        } catch {
            return false;
        }
    });

export const getAllLocalSessions = (): SwitchableSession[] =>
    Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .reduce<SwitchableSession[]>((sessions, key) => {
            try {
                const rawSession = localStorage.getItem(key)!;
                const encryptedSession = JSON.parse(rawSession);

                if (!authStore.validPersistedSession(encryptedSession)) throw new Error('Invalid persisted session');
                const { userData, LocalID, lastUsedAt } = encryptedSession;
                const { PrimaryEmail = '', DisplayName = '' } = userData ? decodeUserData(userData) : {};

                sessions.push({
                    DisplayName,
                    lastUsedAt,
                    LocalID: LocalID!,
                    PrimaryEmail,
                    UID: encryptedSession.UID,
                });
            } catch (err) {
                localStorage.removeItem(key);
            }

            return sessions;
        }, []);
