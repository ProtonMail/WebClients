import { serverTime } from '@proton/crypto';
import { wait } from '@proton/shared/lib/helpers/promise';
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
import { isSelf } from '../user/helpers';
import { appMode } from '../webpack.constants';
import type { PersistedSession, PersistedSessionLite } from './SessionInterface';
import { generateClientKey, getClientKey } from './clientKey';
import { InvalidPersistentSessionError } from './error';
import type { LocalKeyResponse, LocalSessionResponse } from './interface';
import type { OfflineKey } from './offlineKey';
import { generateOfflineKey } from './offlineKey';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessions,
    removePersistedSessionByLocalIDAndUID,
    setPersistedSessionWithBlob,
} from './persistedSessionStorage';

export const compareSessions = (a: ActiveSessionLite, b: ActiveSessionLite) => {
    if (a.remote.DisplayName && b.remote.DisplayName) {
        return a.remote.DisplayName.localeCompare(b.remote.DisplayName);
    }
    if (a.remote.Username && b.remote.Username) {
        return a.remote.Username.localeCompare(b.remote.Username);
    }
    if (a.remote.PrimaryEmail && b.remote.PrimaryEmail) {
        return a.remote.PrimaryEmail.localeCompare(b.remote.PrimaryEmail);
    }
    return 0;
};

interface SessionOptions {
    clearInvalidSession: boolean;
}

const defaultSessionOptions: SessionOptions = {
    clearInvalidSession: true,
};

export type ResumedSessionResult = {
    UID: string;
    LocalID: number;
    keyPassword?: string;
    User: tsUser;
    persistent: boolean;
    trusted: boolean;
    clientKey: string;
    offlineKey: OfflineKey | undefined;
    persistedAt: number;
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

export const resumeSession = async ({
    api,
    localID,
    options = defaultSessionOptions,
}: {
    api: Api;
    localID: number;
    options?: SessionOptions;
}): Promise<ResumedSessionResult> => {
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
        persistedAt,
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
            persistedAt,
        };
    } catch (e: any) {
        if (options.clearInvalidSession && getIs401Error(e)) {
            logRemoval(e, persistedUID, 'resume 401');
            await removePersistedSessionByLocalIDAndUID(localID, persistedUID).catch(noop);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        if (options.clearInvalidSession && e instanceof InvalidPersistentSessionError) {
            logRemoval(e, persistedUID, 'invalid blob');
            await api(withUIDHeaders(persistedUID, revoke())).catch(noop);
            await removePersistedSessionByLocalIDAndUID(localID, persistedUID).catch(noop);
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
    const persistedAt = +serverTime();

    let offlineKey = maybeOfflineKey;

    if (mode === 'sso') {
        if (clearKeyPassword && !offlineKey) {
            offlineKey = await generateOfflineKey(clearKeyPassword);
        }
        await setPersistedSessionWithBlob(LocalID, key, {
            UID,
            UserID: User.ID,
            keyPassword,
            isSelf: isSelf(User),
            persistent,
            trusted,
            offlineKey,
            persistedAt,
        });
    }

    return { clientKey: serializedData, offlineKey, persistedAt };
};

export const findPersistedSession = ({
    persistedSessions,
    UserID,
    isSelf,
}: {
    persistedSessions: PersistedSession[];
    UserID: string;
    isSelf: boolean;
}) => {
    return persistedSessions.find((persistedSession) => {
        const isSameUserID = persistedSession.UserID === UserID;
        const isSameSelf = persistedSession.isSelf === isSelf;
        return isSameUserID && isSameSelf;
    });
};

export type ActiveSessionBase<T> = {
    remote: LocalSessionResponse;
    persisted: T;
};

export type ActiveSessionLite = ActiveSessionBase<PersistedSessionLite>;
export type ActiveSession = ActiveSessionBase<PersistedSession>;

export const getMissingPersistedSessionsFromActiveSessions = (
    persistedSessions: PersistedSession[],
    activeSessions: ActiveSessionLite[]
) => {
    const localSessionsSet = new Set(activeSessions.map(({ persisted }) => persisted.localID));
    return persistedSessions.filter((persistedSession) => {
        return !localSessionsSet.has(persistedSession.localID);
    });
};

export const getActiveSessionsMissingFromRemoteResponse = async ({
    api,
    persistedSessions,
    activeSessions,
}: {
    api: Api;
    persistedSessions: PersistedSession[];
    activeSessions: ActiveSessionLite[];
}): Promise<ActiveSession[]> => {
    const nonExistingSessions = getMissingPersistedSessionsFromActiveSessions(persistedSessions, activeSessions);

    if (!nonExistingSessions.length) {
        return [];
    }

    const result = await Promise.all(
        nonExistingSessions.map(async (persistedSession) => {
            const { UID, localID } = persistedSession;
            const result = await api<{ User: tsUser }>(withUIDHeaders(UID, getUser())).catch((e) => {
                if (getIs401Error(e)) {
                    logRemoval(e, UID, 'non-existing-sessions');
                    removePersistedSessionByLocalIDAndUID(localID, UID).catch(noop);
                }
            });
            if (!result?.User) {
                return;
            }
            const User = result.User;
            const remoteSession: LocalSessionResponse = {
                UID,
                Username: User.Name,
                DisplayName: User.DisplayName,
                PrimaryEmail: User.Email,
                UserID: User.ID,
                LocalID: localID,
            };
            return {
                remote: remoteSession,
                persisted: persistedSession,
            };
        })
    );

    return result.filter(isTruthy);
};

export const getActiveSessionsData = async <T extends PersistedSessionLite>({
    api,
    persistedSessions,
}: {
    api: Api;
    persistedSessions: T[];
}): Promise<ActiveSessionBase<T>[]> => {
    const map = Object.fromEntries(persistedSessions.map((value) => [value.localID, value]));
    const { Sessions = [] } = await api<{ Sessions: LocalSessionResponse[] }>(getLocalSessions());
    return Sessions.reduce<ActiveSessionBase<T>[]>((acc, remote) => {
        const persisted = map[remote.LocalID];
        if (persisted) {
            acc.push({ persisted, remote });
        }
        return acc;
    }, []);
};

export enum GetActiveSessionType {
    Switch,
    AutoPick,
}

export type GetActiveSessionsResult =
    | {
          session?: ResumedSessionResult;
          sessions: ActiveSession[];
          type: GetActiveSessionType.Switch;
      }
    | {
          session: ResumedSessionResult;
          sessions: ActiveSession[];
          type: GetActiveSessionType.AutoPick;
      };

const pickSessionByEmail = async ({
    api,
    email,
    session,
    sessions,
    options,
}: {
    api: Api;
    email: string;
    session?: ResumedSessionResult;
    sessions: ActiveSession[];
    options?: SessionOptions;
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
                return resumeSession({ api, localID: firstMatchingSession.LocalID, options });
            }
        }
        return;
    }

    if (matchingSession.persisted.localID === session?.LocalID) {
        return session;
    }

    return resumeSession({ api, localID: matchingSession.remote.LocalID, options });
};

export const maybePickSessionByEmail = async ({
    api,
    localID,
    email,
    result,
    options,
}: {
    api: Api;
    localID?: number;
    email?: string;
    result: GetActiveSessionsResult;
    options?: SessionOptions;
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
            options,
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
    options,
}: {
    api: Api;
    localID?: number;
    email?: string;
    options?: SessionOptions;
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
            const session = await resumeSession({ api, localID: persistedSession.localID, options });
            // Refetch to have latest since we're looping and it might get refreshed
            const latestPersistedSessions = getPersistedSessions();
            const activeSessions = await getActiveSessionsData({
                api: getUIDApi(session.UID, api),
                persistedSessions: latestPersistedSessions,
            });
            const missingSessions = await getActiveSessionsMissingFromRemoteResponse({
                api,
                activeSessions,
                persistedSessions: latestPersistedSessions,
            });
            const sessions = [...activeSessions, ...missingSessions];

            const hasOnlyOneSessionAndUnspecifiedLocalID = localID === undefined && sessions.length === 1;
            // This is technically incorrect, but users have bookmarked sessions with expired local ids, so in the case of 1 session on account
            // we still autopick the session even if a specific local id is requested.
            // TODO: We need to improve this, specifically the scenarios when account has lost a session but the session still exists on subdomains.
            const hasOnlyOneSession = sessions.length === 1;

            const type =
                session && (hasOnlyOneSession || hasOnlyOneSessionAndUnspecifiedLocalID || localID === session.LocalID)
                    ? GetActiveSessionType.AutoPick
                    : GetActiveSessionType.Switch;

            return await maybePickSessionByEmail({ api, localID, email, result: { session, sessions, type }, options });
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

export const maybeResumeSessionByUser = async ({
    api,
    User,
    options,
}: {
    api: Api;
    User: tsUser;
    options?: SessionOptions;
}) => {
    const maybePersistedSession = findPersistedSession({
        persistedSessions: getPersistedSessions(),
        UserID: User.ID,
        isSelf: isSelf(User),
    });
    if (!maybePersistedSession) {
        return;
    }
    try {
        return await resumeSession({ api, localID: maybePersistedSession.localID, options });
    } catch (e: any) {
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }
};

export const cleanupInactivePersistedSession = async ({
    api,
    persistedSession,
}: {
    api: Api;
    persistedSession: PersistedSession;
}) => {
    const { UID, localID } = persistedSession;
    // Double check that the session still exists
    if (!getPersistedSession(localID)) {
        return;
    }
    try {
        // Simple check to see if the session is still valid.
        // It's validated with the API to ensure it doesn't accidentally remove persisted sessions that might still be
        // valid but which are not returned from the local response
        await api<{ User: tsUser }>(withUIDHeaders(UID, getUser()));
    } catch (e) {
        if (getIs401Error(e)) {
            await removePersistedSessionByLocalIDAndUID(localID, UID).catch(noop);
        }
    }
};

export const cleanupInactivePersistedSessions = async ({
    persistedSessions,
    api,
    delay = 2_000,
}: {
    persistedSessions: PersistedSession[];
    api: Api;
    delay?: number;
}) => {
    for (const persistedSession of persistedSessions) {
        await cleanupInactivePersistedSession({ api, persistedSession });
        // Add a little bit of a delay to avoid spamming the API
        await wait(delay);
    }
};
