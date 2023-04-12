import { updateVersionCookie, versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import { PersistedSessionWithLocalID } from '@proton/shared/lib/authentication/SessionInterface';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getLocalKey, getLocalSessions, setLocalKey } from '../api/auth';
import { getIs401Error } from '../api/helpers/apiErrorHelper';
import { InactiveSessionError } from '../api/helpers/withApiHandlers';
import { getUser } from '../api/user';
import { getAppFromPathnameSafe } from '../apps/slugHelper';
import { SECOND, isSSOMode } from '../constants';
import { getIsAuthorizedApp, getIsDrawerPostMessage, postMessageFromIframe } from '../drawer/helpers';
import { DRAWER_EVENTS } from '../drawer/interfaces';
import { withUIDHeaders } from '../fetch/headers';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';
import { Api, User as tsUser } from '../interfaces';
import { getKey } from './cryptoHelper';
import { InvalidPersistentSessionError } from './error';
import { LocalKeyResponse, LocalSessionResponse } from './interface';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessions,
    removePersistedSession,
    setPersistedSessionWithBlob,
} from './persistedSessionStorage';

export type ResumedSessionResult = {
    UID: string;
    LocalID: number;
    keyPassword?: string;
    User: tsUser;
    persistent: boolean;
    trusted: boolean;
};

const handleDrawerApp = (localID: number) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    let resolve: (arg: undefined | ResumedSessionResult) => void = () => {};
    const promise = new Promise<undefined | ResumedSessionResult>((res) => {
        resolve = res;
    });

    const isIframe = getIsIframe();
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const handler = (event: MessageEvent) => {
        if (!getIsDrawerPostMessage(event)) {
            return;
        }

        if (event.data.type === DRAWER_EVENTS.SESSION) {
            const { UID, keyPassword, User, persistent, trusted, tag } = event.data.payload;
            window.removeEventListener('message', handler);

            if (timeout) {
                clearTimeout(timeout);
            }

            // When opening the drawer, we might need to set the tag of the app we are opening
            // Otherwise we will not open the correct version of the app (default instead of beta or alpha)
            if (tag && versionCookieAtLoad !== tag) {
                updateVersionCookie(tag, undefined);
                window.location.reload();
            }

            resolve({ UID, keyPassword, User, persistent, trusted, LocalID: localID });
        }
    };

    if (parentApp && getIsAuthorizedApp(parentApp) && isIframe) {
        postMessageFromIframe({ type: DRAWER_EVENTS.READY }, parentApp);
        window.addEventListener('message', handler);

        // Resolve the promise if the parent app does not respond
        timeout = setTimeout(() => {
            resolve(undefined);
        }, SECOND);
    } else {
        resolve(undefined);
    }
    return promise;
};

export const resumeSession = async (api: Api, localID: number, User?: tsUser): Promise<ResumedSessionResult> => {
    const res = await handleDrawerApp(localID);

    // If we got a res, it means that we are in a drawer app. We don't need to make the whole resumeSession part
    if (res) {
        return res;
    }
    const persistedSession = getPersistedSession(localID);
    if (!persistedSession) {
        throw new InvalidPersistentSessionError('Missing persisted session or UID');
    }
    const {
        UID: persistedUID,
        UserID: persistedUserID,
        blob: persistedSessionBlobString,
        persistent,
        trusted,
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
            return { UID: persistedUID, LocalID: localID, keyPassword, User: persistedUser, persistent, trusted };
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
        return { UID: persistedUID, LocalID: localID, User, persistent, trusted };
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
    trusted: boolean;
}

export const persistSessionWithPassword = async ({
    api,
    keyPassword,
    User,
    UID,
    LocalID,
    persistent,
    trusted,
}: PersistSessionWithPasswordArgs) => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const key = await getKey(rawKey);
    const base64StringKey = uint8ArrayToBase64String(rawKey);
    await api<LocalKeyResponse>(setLocalKey(base64StringKey));
    await setPersistedSessionWithBlob(LocalID, key, {
        UID,
        UserID: User.ID,
        keyPassword,
        isSubUser: !!User.OrganizationPrivateKey,
        persistent,
        trusted,
    });
};

interface PersistLoginArgs {
    api: Api;
    User: tsUser;
    keyPassword?: string;
    persistent: boolean;
    trusted: boolean;
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
    persistent,
    trusted,
}: PersistLoginArgs) => {
    if (isSSOMode) {
        await persistSessionWithPassword({
            api,
            UID,
            User,
            LocalID,
            keyPassword: keyPassword || '',
            persistent,
            trusted,
        });
    }
};

export const getActiveSessionByUserID = (UserID: string, isSubUser: boolean) => {
    return getPersistedSessions().find((persistedSession) => {
        const isSameUserID = persistedSession.UserID === UserID;
        const isSameSubUser = persistedSession.isSubUser === isSubUser;
        return isSameUserID && isSameSubUser;
    });
};

export interface LocalSessionPersisted {
    remote: LocalSessionResponse;
    persisted: PersistedSessionWithLocalID;
}

const getNonExistingSessions = async (
    api: Api,
    persistedSessions: PersistedSessionWithLocalID[],
    localSessions: LocalSessionPersisted[]
): Promise<LocalSessionPersisted[]> => {
    const localSessionsSet = new Set(
        localSessions.map((localSessionPersisted) => localSessionPersisted.persisted.localID)
    );

    const nonExistingSessions = persistedSessions.filter((persistedSession) => {
        return !localSessionsSet.has(persistedSession.localID);
    }, []);

    if (!nonExistingSessions.length) {
        return [];
    }

    const result = await Promise.all(
        nonExistingSessions.map(async (persistedSession) => {
            const result = await api<{ User: tsUser }>(withUIDHeaders(persistedSession.UID, getUser())).catch(noop);
            if (!result?.User) {
                return undefined;
            }
            const User = result.User;
            const remoteSession: LocalSessionResponse = {
                Username: User.Name,
                DisplayName: User.DisplayName,
                PrimaryEmail: User.Email,
                UserID: User.ID,
                LocalID: persistedSession.localID,
            };
            return {
                remote: remoteSession,
                persisted: persistedSession,
            };
        })
    );

    return result.filter(isTruthy);
};

export type GetActiveSessionsResult = { session?: ResumedSessionResult; sessions: LocalSessionPersisted[] };
export const getActiveSessions = async (api: Api): Promise<GetActiveSessionsResult> => {
    const persistedSessions = getPersistedSessions();
    const persistedSessionsMap = Object.fromEntries(
        persistedSessions.map((persistedSession) => [persistedSession.localID, persistedSession])
    );

    for (const persistedSession of persistedSessions) {
        try {
            const validatedSession = await resumeSession(api, persistedSession.localID);
            const { Sessions = [] } = await api<{
                Sessions: LocalSessionResponse[];
            }>(withUIDHeaders(validatedSession.UID, getLocalSessions()));

            // The returned sessions have to exist in localstorage to be able to activate
            const maybeActiveSessions = Sessions.map((remoteSession) => {
                return {
                    persisted: persistedSessionsMap[remoteSession.LocalID],
                    remote: remoteSession,
                };
            }).filter((value): value is LocalSessionPersisted => !!value.persisted);

            const nonExistingSessions = await getNonExistingSessions(api, persistedSessions, maybeActiveSessions);
            if (nonExistingSessions.length) {
                captureMessage('Unexpected non-existing sessions', {
                    extra: {
                        length: nonExistingSessions.length,
                        ids: nonExistingSessions.map((session) => ({
                            id: `${session.remote.Username || session.remote.PrimaryEmail || session.remote.UserID}`,
                            lid: session.remote.LocalID,
                        })),
                    },
                });
            }

            return {
                session: validatedSession,
                sessions: [...maybeActiveSessions, ...nonExistingSessions],
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
