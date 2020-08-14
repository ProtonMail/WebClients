import getRandomValues from 'get-random-values';
import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { getLocalKey, getLocalSessions, setCookies, setLocalKey } from '../api/auth';
import { getUser } from '../api/user';
import { getIs401Error } from '../api/helpers/apiErrorHelper';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessions,
    removePersistedSession,
    setPersistedSession,
    setPersistedSessionWithBlob,
} from './persistedSessionStorage';
import { isSSOMode } from '../constants';
import { Api, User as tsUser } from '../interfaces';
import { LocalKeyResponse, LocalSessionResponse } from './interface';
import { InvalidPersistentSessionError } from './error';
import { getRandomString } from '../helpers/string';
import { getSessionKey } from './sessionBlobCryptoHelper';
import { deserializeUint8Array, serializeUint8Array } from '../helpers/serialization';

export type ResumedSessionResult = {
    UID: string;
    LocalID: number;
    keyPassword?: string;
    User?: tsUser;
};
export const resumeSession = async (api: Api, localID: number): Promise<ResumedSessionResult> => {
    const persistedSession = getPersistedSession(localID);
    const persistedUID = persistedSession?.UID;

    // Persistent session is invalid, redirect to re-fork this session
    if (!persistedSession || !persistedUID) {
        removePersistedSession(localID);
        throw new InvalidPersistentSessionError('Missing persisted session or UID');
    }

    // Persistent session to be validated
    const persistedSessionBlobString = persistedSession.blob;

    // User with password
    if (persistedSessionBlobString) {
        try {
            const [{ ClientKey }, { User }] = await Promise.all([
                api<LocalKeyResponse>(withUIDHeaders(persistedUID, getLocalKey())),
                api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser())),
            ]);
            const rawSessionKey = deserializeUint8Array(ClientKey);
            const sessionKey = getSessionKey(rawSessionKey);
            const { keyPassword } = await getDecryptedPersistedSessionBlob(sessionKey, persistedSessionBlobString);
            return { UID: persistedUID, LocalID: localID, keyPassword, User };
        } catch (e) {
            if (getIs401Error(e)) {
                removePersistedSession(localID);
                throw new InvalidPersistentSessionError('Session invalid');
            }
            throw e;
        }
    }

    try {
        // User without password
        const { User } = await api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser()));
        return { UID: persistedUID, LocalID: localID, User };
    } catch (e) {
        if (getIs401Error(e)) {
            removePersistedSession(localID);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        throw e;
    }
};

interface PersistLoginArgs {
    api: Api;
    keyPassword?: string;
    AccessToken: string;
    RefreshToken: string;
    UID: string;
    LocalID: number;
}
export const persistSession = async ({
    api,
    keyPassword,
    UID,
    LocalID,
    AccessToken,
    RefreshToken,
}: PersistLoginArgs) => {
    if (isSSOMode) {
        if (keyPassword) {
            const rawSessionKey = getRandomValues(new Uint8Array(32));
            const sessionKey = getSessionKey(rawSessionKey);
            const serializedSessionKey = serializeUint8Array(rawSessionKey);
            await api<LocalKeyResponse>(withAuthHeaders(UID, AccessToken, setLocalKey(serializedSessionKey)));
            await setPersistedSessionWithBlob(LocalID, sessionKey, { UID, keyPassword });
        } else {
            setPersistedSession(LocalID, { UID });
        }
    }
    await api(withAuthHeaders(UID, AccessToken, setCookies({ UID, RefreshToken, State: getRandomString(24) })));
};

export type GetActiveSessionsResult = { session?: ResumedSessionResult; sessions: LocalSessionResponse[] };
export const getActiveSessions = async (api: Api): Promise<GetActiveSessionsResult> => {
    const persistedSessions = getPersistedSessions();
    for (const persistedSession of persistedSessions) {
        try {
            const validatedSession = await resumeSession(api, persistedSession.localID);
            const { Sessions = [] } = await api<{ Sessions: LocalSessionResponse[] }>(
                withUIDHeaders(validatedSession.UID, getLocalSessions())
            );
            // The returned sessions have to exist in localstorage to be able to activate
            const maybeActiveSessions = Sessions.filter(({ LocalID }) => {
                return persistedSessions.some(({ localID }) => localID === LocalID);
            });
            return {
                session: validatedSession,
                sessions: maybeActiveSessions,
            };
        } catch (e) {
            if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                // Session expired, try another session
                continue;
            }
            // If a network error, throw here to show the error screen
            throw e;
        }
    }
    return {
        session: undefined,
        sessions: [],
    };
};
