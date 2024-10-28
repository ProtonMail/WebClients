import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getLocalKey, getLocalSessions, revoke, setLocalKey } from '../api/auth';
import { getIs401Error } from '../api/helpers/apiErrorHelper';
import { getUIDApi } from '../api/helpers/customConfig';
import { InactiveSessionError } from '../api/helpers/errors';
import { getUser } from '../api/user';
import { withUIDHeaders } from '../fetch/headers';
import { captureMessage } from '../helpers/sentry';
import type { Api, User as tsUser } from '../interfaces';
import { appMode } from '../webpack.constants';
import type { PersistedSessionWithLocalID } from './SessionInterface';
import { generateClientKey, getClientKey } from './clientKey';
import { InvalidPersistentSessionError } from './error';
import type { LocalKeyResponse, LocalSessionResponse } from './interface';
import type { OfflineKey } from './offlineKey';
import { generateOfflineKey } from './offlineKey';
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
    clientKey: string;
    offlineKey: OfflineKey | undefined;
};

export const logRemoval = (e: any = {}, UID: string, context: string) => {
    if (e.status === 401) {
        return;
    }
    captureMessage(`Removing session due to `, {
        extra: {
            reason: `${e.name} - ${e.message} - ${e.status || 0}`,
            UID,
            context,
        },
    });
};

export const resumeSession = async ({ api, localID }: { api: Api; localID: number }): Promise<ResumedSessionResult> => {
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
        payloadVersion,
    } = persistedSession;

    try {
        const [ClientKey, latestUser] = await Promise.all([
            api<LocalKeyResponse>(withUIDHeaders(persistedUID, getLocalKey())).then(({ ClientKey }) => ClientKey),
            api<{ User: tsUser }>(withUIDHeaders(persistedUID, getUser())).then(({ User }) => User),
        ]);
        if (persistedUserID !== latestUser.ID) {
            throw InactiveSessionError();
        }
        let keyPassword: undefined | string;
        let offlineKey: undefined | OfflineKey;
        if (persistedSessionBlobString && ClientKey) {
            const key = await getClientKey(ClientKey);
            const decryptedBlob = await getDecryptedPersistedSessionBlob(
                key,
                persistedSessionBlobString,
                payloadVersion
            );
            keyPassword = decryptedBlob.keyPassword;
            if (
                decryptedBlob.type === 'offline' &&
                persistedSession.payloadType === 'offline' &&
                persistedSession.offlineKeySalt
            ) {
                offlineKey = {
                    password: decryptedBlob.offlineKeyPassword,
                    salt: persistedSession.offlineKeySalt,
                };
            }
        }
        return {
            UID: persistedUID,
            LocalID: localID,
            keyPassword,
            User: latestUser,
            persistent,
            trusted,
            clientKey: ClientKey,
            offlineKey,
        };
    } catch (e: any) {
        if (getIs401Error(e)) {
            logRemoval(e, persistedUID, 'resume 401');
            await removePersistedSession(localID, persistedUID).catch(noop);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        if (e instanceof InvalidPersistentSessionError) {
            logRemoval(e, persistedUID, 'invalid blob');
            await api(withUIDHeaders(persistedUID, revoke())).catch(noop);
            await removePersistedSession(localID, persistedUID).catch(noop);
            throw e;
        }
        throw e;
    }
};

interface PersistSessionWithPasswordArgs {
    api: Api;
    clearKeyPassword: string;
    keyPassword: string | undefined;
    offlineKey?: OfflineKey;
    User: tsUser;
    UID: string;
    LocalID: number;
    persistent: boolean;
    trusted: boolean;
    mode?: 'sso' | 'standalone';
}

export const persistSession = async ({
    api,
    clearKeyPassword,
    keyPassword = '',
    offlineKey: maybeOfflineKey,
    User,
    UID,
    LocalID,
    persistent,
    trusted,
    mode = appMode,
}: PersistSessionWithPasswordArgs) => {
    const { serializedData, key } = await generateClientKey();
    await api<LocalKeyResponse>(setLocalKey(serializedData));

    let offlineKey = maybeOfflineKey;

    if (mode === 'sso') {
        if (clearKeyPassword && !offlineKey) {
            offlineKey = await generateOfflineKey(clearKeyPassword);
        }
        await setPersistedSessionWithBlob(LocalID, key, {
            UID,
            UserID: User.ID,
            keyPassword,
            isSubUser: !!User.OrganizationPrivateKey,
            persistent,
            trusted,
            offlineKey,
        });
    }

    return { clientKey: serializedData, offlineKey };
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
            const result = await api<{ User: tsUser }>(withUIDHeaders(persistedSession.UID, getUser())).catch((e) => {
                if (getIs401Error(e)) {
                    logRemoval(e, persistedSession.UID, 'non-existing-sessions');
                    removePersistedSession(persistedSession.localID, persistedSession.UID).catch(noop);
                }
            });
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

export const getActiveLocalSession = async (api: Api) => {
    const { Sessions = [] } = await api<{ Sessions: LocalSessionResponse[] }>(getLocalSessions());

    const persistedSessions = getPersistedSessions();
    const persistedSessionsMap = Object.fromEntries(
        persistedSessions.map((persistedSession) => [persistedSession.localID, persistedSession])
    );

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

    return [...maybeActiveSessions, ...nonExistingSessions];
};

export enum GetActiveSessionType {
    Switch,
    AutoPick,
}

export type GetActiveSessionsResult =
    | {
          session?: ResumedSessionResult;
          sessions: LocalSessionPersisted[];
          type: GetActiveSessionType.Switch;
      }
    | {
          session: ResumedSessionResult;
          sessions: LocalSessionPersisted[];
          type: GetActiveSessionType.AutoPick;
      };

const pickSessionByEmail = async ({
    api,
    email,
    session,
    sessions,
}: {
    api: Api;
    email: string;
    session?: ResumedSessionResult;
    sessions: LocalSessionPersisted[];
}) => {
    const lowerCaseEmail = email.toLowerCase();

    const matchingSession = sessions.find((session) => session.remote.PrimaryEmail?.toLowerCase() === lowerCaseEmail);

    if (!matchingSession) {
        if (session) {
            const uidApi = getUIDApi(session.UID, api);
            const result = await uidApi<{
                Sessions: LocalSessionResponse[];
            }>(getLocalSessions({ Email: lowerCaseEmail }));
            const remoteSessions = result?.Sessions || [];
            const remoteLocalIDMap = remoteSessions.reduce<{ [key: string]: LocalSessionResponse }>((acc, value) => {
                acc[value.LocalID] = value;
                return acc;
            }, {});
            const firstMatchingSessionByLocalID = sessions.find(({ remote }) =>
                Boolean(remoteLocalIDMap[remote.LocalID])
            );
            if (firstMatchingSessionByLocalID) {
                return resumeSession({ api, localID: firstMatchingSessionByLocalID.remote.LocalID });
            }
            const firstMatchingSession = remoteSessions[0];
            if (firstMatchingSession && firstMatchingSession.LocalID !== undefined) {
                return resumeSession({ api, localID: firstMatchingSession.LocalID });
            }
        }
        return;
    }

    if (matchingSession.persisted.localID === session?.LocalID) {
        return session;
    }

    return resumeSession({ api, localID: matchingSession.remote.LocalID });
};

export const maybePickSessionByEmail = async ({
    api,
    localID,
    email,
    result,
}: {
    api: Api;
    localID?: number;
    email?: string;
    result: GetActiveSessionsResult;
}): Promise<GetActiveSessionsResult> => {
    const { session, sessions } = result;

    // The email selector is used in case there's no localID or if the requested localID did not exist
    if (email && (localID === undefined || localID !== session?.LocalID)) {
        // Ignore if it fails, worse case the user will have to pick the account.
        const maybeMatchingResumedSession = await pickSessionByEmail({
            api,
            email,
            session,
            sessions,
        }).catch(noop);

        if (maybeMatchingResumedSession) {
            // Increase ordered priority to the requested session
            const sortedSessions = [
                ...sessions.filter((a) => a.remote.LocalID === maybeMatchingResumedSession.LocalID),
                ...sessions.filter((a) => a.remote.LocalID !== maybeMatchingResumedSession.LocalID),
            ];

            return {
                session: maybeMatchingResumedSession,
                sessions: sortedSessions,
                type: GetActiveSessionType.AutoPick,
            };
        }

        // If a matching email could not be found, fallback to switch since it's unsure which account the user should use
        return { session, sessions, type: GetActiveSessionType.Switch };
    }

    return result;
};

export const getActiveSessions = async ({
    api,
    localID,
    email,
}: {
    api: Api;
    localID?: number;
    email?: string;
}): Promise<GetActiveSessionsResult> => {
    let persistedSessions = getPersistedSessions();

    if (localID !== undefined) {
        // Increase ordered priority to the specified local ID
        persistedSessions = [
            ...persistedSessions.filter((a) => a.localID === localID),
            ...persistedSessions.filter((a) => a.localID !== localID),
        ];
    }

    for (const persistedSession of persistedSessions) {
        try {
            const session = await resumeSession({ api, localID: persistedSession.localID });
            const sessions = await getActiveLocalSession(getUIDApi(session.UID, api));

            const hasOnlyOneSessionAndUnspecifiedLocalID = localID === undefined && sessions.length === 1;
            // This is technically incorrect, but users have bookmarked sessions with expired local ids, so in the case of 1 session on account
            // we still autopick the session even if a specific local id is requested.
            // TODO: We need to improve this, specifically the scenarios when account has lost a session but the session still exists on subdomains.
            const hasOnlyOneSession = sessions.length === 1;

            const type =
                session && (hasOnlyOneSession || hasOnlyOneSessionAndUnspecifiedLocalID || localID === session.LocalID)
                    ? GetActiveSessionType.AutoPick
                    : GetActiveSessionType.Switch;

            return await maybePickSessionByEmail({ api, localID, email, result: { session, sessions, type } });
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
        type: GetActiveSessionType.Switch,
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
        return await resumeSession({ api, localID: maybePersistedSession.localID });
    } catch (e: any) {
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }
};
