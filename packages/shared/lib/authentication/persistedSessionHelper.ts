import getRandomValues from '@proton/get-random-values';
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
import { InactiveSessionError } from '../api/helpers/withApiHandlers';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';
import { getKey } from './cryptoHelper';

export type ResumedSessionResult = {
    UID: string;
    LocalID: number;
    keyPassword?: string;
    User: tsUser;
    persistent: boolean;
};
export const resumeSession = async (api: Api, localID: number, User?: tsUser): Promise<ResumedSessionResult> => {
    const persistedSession = getPersistedSession(localID);
    if (!persistedSession) {
        throw new InvalidPersistentSessionError('Missing persisted session or UID');
    }
    const {
        UID: persistedUID,
        UserID: persistedUserID,
        blob: persistedSessionBlobString,
        persistent,
    } = persistedSession;

    // User with password
    if (persistedSessionBlobString) {
        try {
            const [ClientKey, persistedUser] = await Promise.all([
                api<LocalKeyResponse>(withUIDHeaders(persistedUID, getLocalKey())).then(({ ClientKey }) => ClientKey),
                User || api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser())).then(({ User }) => User),
            ]);
            const rawKey = base64StringToUint8Array(ClientKey);
            const key = await getKey(rawKey);
            const { keyPassword } = await getDecryptedPersistedSessionBlob(key, persistedSessionBlobString);
            if (persistedUserID !== persistedUser.ID) {
                throw InactiveSessionError();
            }
            return { UID: persistedUID, LocalID: localID, keyPassword, User: persistedUser, persistent };
        } catch (e: any) {
            if (getIs401Error(e)) {
                removePersistedSession(localID, persistedUID);
                throw new InvalidPersistentSessionError('Session invalid');
            }
            if (e instanceof InvalidPersistentSessionError) {
                removePersistedSession(localID, persistedUID);
                throw e;
            }
            throw e;
        }
    }

    try {
        // User without password
        const { User } = await api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser()));
        if (persistedUserID !== User.ID) {
            throw InactiveSessionError();
        }
        return { UID: persistedUID, LocalID: localID, User, persistent };
    } catch (e: any) {
        if (getIs401Error(e)) {
            removePersistedSession(localID, persistedUID);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        throw e;
    }
};

interface PersistSessionWithPasswordArgs {
    api: Api;
    keyPassword: string;
    User: tsUser;
    UID: string;
    LocalID: number;
    persistent: boolean;
}

export const persistSessionWithPassword = async ({
    api,
    keyPassword,
    User,
    UID,
    LocalID,
    persistent,
}: PersistSessionWithPasswordArgs) => {
    const rawKey = getRandomValues(new Uint8Array(32));
    const key = await getKey(rawKey);
    const base64StringKey = uint8ArrayToBase64String(rawKey);
    await api<LocalKeyResponse>(setLocalKey(base64StringKey));
    await setPersistedSessionWithBlob(LocalID, key, {
        UID,
        UserID: User.ID,
        keyPassword,
        isSubUser: !!User.OrganizationPrivateKey,
        persistent,
    });
};

interface PersistLoginArgs {
    api: Api;
    User: tsUser;
    keyPassword?: string;
    persistent: boolean;
    AccessToken: string;
    RefreshToken: string;
    UID: string;
    LocalID: number;
}

export const persistSession = async ({
    api,
    keyPassword,
    User,
    UID,
    LocalID,
    AccessToken,
    RefreshToken,
    persistent,
}: PersistLoginArgs) => {
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    if (isSSOMode) {
        if (keyPassword) {
            await persistSessionWithPassword({ api: authApi, UID, User, LocalID, keyPassword, persistent });
        } else {
            setPersistedSession(LocalID, { UID, UserID: User.ID, persistent });
        }
    }

    await authApi(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: persistent }));
};

export const getActiveSessionByUserID = (UserID: string, isSubUser: boolean) => {
    return getPersistedSessions().find((persistedSession) => {
        const isSameUserID = persistedSession.UserID === UserID;
        const isSameSubUser = persistedSession.isSubUser === isSubUser;
        return isSameUserID && isSameSubUser;
    });
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
        } catch (e: any) {
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

export const maybeResumeSessionByUser = async (
    api: Api,
    User: tsUser,
    isSubUser: boolean = !!User.OrganizationPrivateKey
) => {
    const maybePersistedSession = getActiveSessionByUserID(User.ID, isSubUser);
    if (!maybePersistedSession) {
        return;
    }
    try {
        return await resumeSession(api, maybePersistedSession.localID, User);
    } catch (e: any) {
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }
};
