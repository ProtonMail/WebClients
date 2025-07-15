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
import { type PersistedSession, type PersistedSessionLite, SessionSource } from './SessionInterface';
import { generateClientKey, getClientKey } from './clientKey';
import { InvalidPersistentSessionError } from './error';
import type { LocalKeyResponse, LocalSessionResponse } from './interface';
import type { OfflineKey } from './offlineKey';
import { generateOfflineKey } from './offlineKey';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessionData,
    getPersistedSessions,
    removePersistedSessionByLocalIDAndUID,
    setPersistedSession,
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
    clearInvalidSession?: boolean;
    source?: SessionSource[] | null;
}

const defaultSessionOptions = {
    clearInvalidSession: true,
    source: null,
} satisfies SessionOptions;

export type ResumedSessionResult = {
    User: tsUser;
    UID: string;
    localID: number;
    keyPassword: string;
    clientKey: string;
    offlineKey: OfflineKey | undefined;
    persistedSession: PersistedSession;
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
    options,
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
        let keyPassword = '';
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
            User: latestUser,
            UID: persistedUID,
            localID,
            keyPassword,
            clientKey: ClientKey,
            offlineKey,
            persistedSession,
        };
    } catch (e: any) {
        const clearInvalidSession = options?.clearInvalidSession ?? defaultSessionOptions.clearInvalidSession;
        if (clearInvalidSession && getIs401Error(e)) {
            logRemoval(e, persistedUID, 'resume 401');
            await removePersistedSessionByLocalIDAndUID(localID, persistedUID).catch(noop);
            throw new InvalidPersistentSessionError('Session invalid');
        }
        if (clearInvalidSession && e instanceof InvalidPersistentSessionError) {
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
    keyPassword: string;
    offlineKey?: OfflineKey;
    User: tsUser;
    UID: string;
    LocalID: number;
    persistent: boolean;
    trusted: boolean;
    mode?: 'sso' | 'standalone';
    source: PersistedSession['source'];
}

/**
 * This is an assertion to ensure that the client doesn't blindly overwrite existing session
 * when it gets the same Local ID. This error should never happen, so it's not dealt with
 * better than erroring out. It's only performed at login and not other flows as a first
 * step to gather data how often it occurs.
 */
export const assertUniqueLocalID = async ({
    api,
    LocalID,
    UID,
}: Pick<PersistSessionWithPasswordArgs, 'api' | 'LocalID' | 'UID'>) => {
    const persistedSession = getPersistedSession(LocalID);
    if (!persistedSession) {
        return;
    }
    try {
        const session = await resumeSession({ api, localID: LocalID });
        // This error should never happen, it's intended as a safety mechanism to not blindly overwrite existing and valid sessions that are
        // already persisted at that local id. This check is needed because it doesn't trust the API to always give a unique local id for this client.
        if (session.UID !== UID) {
            captureMessage('Duplicate local id', { level: 'info', extra: { LocalID, UID, ExistingUID: session.UID } });
            // If it happens, keep the old session and clear the new session.
            api(withUIDHeaders(UID, revoke())).catch(noop);
            throw new Error('Incorrect sign in state. Please try again.');
        }
    } catch (e) {
        if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
            // If session resumption errors out it's fine
            return;
        }
        throw e;
    }
};

export const persistSession = async ({
    api,
    clearKeyPassword,
    keyPassword,
    offlineKey: maybeOfflineKey,
    User,
    UID,
    LocalID,
    persistent,
    trusted,
    mode = appMode,
    source,
}: PersistSessionWithPasswordArgs): Promise<ResumedSessionResult> => {
    const { serializedData, key } = await generateClientKey();
    await api<LocalKeyResponse>(setLocalKey(serializedData));
    const persistedAt = +serverTime();

    let offlineKey = maybeOfflineKey;

    if (mode === 'sso' && clearKeyPassword && !offlineKey) {
        offlineKey = await generateOfflineKey(clearKeyPassword);
    }
    const persistedSession = await getPersistedSessionData(LocalID, key, {
        UID,
        UserID: User.ID,
        keyPassword,
        isSelf: isSelf(User),
        persistent,
        trusted,
        offlineKey,
        persistedAt,
        source,
    });

    await setPersistedSession(persistedSession);

    return {
        clientKey: serializedData,
        offlineKey,
        persistedSession,
        UID,
        localID: LocalID,
        User,
        keyPassword,
    };
};

export const findPersistedSession = ({
    persistedSessions,
    UserID,
    isSelf,
    source,
}: {
    persistedSessions: PersistedSession[];
    UserID: string;
    isSelf: boolean;
    source: SessionSource[] | null;
}) => {
    return persistedSessions.find((persistedSession) => {
        const isSameUserID = persistedSession.UserID === UserID;
        const isSameSelf = persistedSession.isSelf === isSelf;
        const isSameSource = source === null ? true : source.some((value) => value === persistedSession.source);
        return isSameUserID && isSameSelf && isSameSource;
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

    if (matchingSession.persisted.localID === session?.localID) {
        return session;
    }

    return resumeSession({ api, localID: matchingSession.remote.LocalID, options });
};

const sessionComparator = (
    a: { localID: number; source: SessionSource },
    b: {
        localID: number;
        source: SessionSource;
    },
    localID: number | undefined
) => {
    // Prioritise the matching session
    if (localID !== undefined) {
        {
            if (a.localID === localID && b.localID !== localID) {
                return -1;
            }
            if (a.localID !== localID && b.localID === localID) {
                return 1;
            }
        }
    }
    // Deprioritise oauth sessions
    {
        if (a.source === SessionSource.Oauth && b.source !== SessionSource.Oauth) {
            return 1;
        }
        if (a.source !== SessionSource.Oauth && b.source === SessionSource.Oauth) {
            return -1;
        }
    }
    return 0;
};

export const maybePickSessionByEmail = async ({
    api,
    localID,
    email,
    result,
    sessions,
    options,
}: {
    api: Api;
    localID?: number;
    email?: string;
    result: GetActiveSessionsResult;
    // All sessions, including oauth
    sessions: ActiveSession[];
    options?: SessionOptions;
}): Promise<GetActiveSessionsResult> => {
    // The email selector is used in case there's no localID or if the requested localID did not exist
    if (email && (localID === undefined || localID !== result.session?.localID)) {
        // Ignore if it fails, worse case the user will have to pick the account.
        const maybeMatchingResumedSession = await pickSessionByEmail({
            api,
            email,
            session: result.session,
            sessions,
            options,
        }).catch(noop);

        if (maybeMatchingResumedSession) {
            const sortedSessions = [...sessions].sort((a, b) =>
                sessionComparator(a.persisted, b.persisted, maybeMatchingResumedSession.localID)
            );
            return {
                session: maybeMatchingResumedSession,
                sessions: sortedSessions,
                type: GetActiveSessionType.AutoPick,
            };
        }

        // If a matching email could not be found, fallback to switch since it's unsure which account the user should use
        return {
            ...result,
            type: GetActiveSessionType.Switch,
        };
    }

    return result;
};

export const getActiveSessionsResult = async ({
    api,
    session,
    localID,
    email,
    options,
}: {
    api: Api;
    session: ResumedSessionResult;
    localID?: number;
    email?: string;
    options?: SessionOptions;
}): Promise<GetActiveSessionsResult> => {
    // Refetch to have latest since this is called from a loop and it might get refreshed
    const persistedSessions = getPersistedSessions().sort((a, b) => {
        return sessionComparator(a, b, session.localID);
    });
    const activeSessions = await getActiveSessionsData({
        api: getUIDApi(session.UID, api),
        persistedSessions,
    });
    const missingSessions = await getActiveSessionsMissingFromRemoteResponse({
        api,
        activeSessions,
        persistedSessions,
    });
    const sessions = [...activeSessions, ...missingSessions].sort((a, b) => {
        return sessionComparator(a.persisted, b.persisted, session.localID);
    });
    // Typically oauth sessions should not be visible in the account picker, and it should not do the auto pick logic when only a single
    // oauth account exists.
    // The only time an oauth session needs to be picked is when BEX opens the "manage subscription" view,
    // the way it does that is by passing an `?email` parameter.
    // TODO: This should ideally be improved to accurately target the BEX scenario and not confuse it with others.
    const sessionsExceptOauth = sessions.filter((session) => session.persisted.source !== SessionSource.Oauth);

    const hasOnlyOneSessionAndUnspecifiedLocalID = localID === undefined && sessionsExceptOauth.length === 1;
    // This is technically incorrect, but users have bookmarked sessions with expired local ids, so in the case of 1 session on account
    // we still autopick the session even if a specific local id is requested.
    // TODO: We need to improve this, specifically the scenarios when account has lost a session but the session still exists on subdomains.
    const hasOnlyOneSession = sessionsExceptOauth.length === 1;

    const type =
        hasOnlyOneSession || hasOnlyOneSessionAndUnspecifiedLocalID || localID === session.localID
            ? GetActiveSessionType.AutoPick
            : GetActiveSessionType.Switch;

    const result: GetActiveSessionsResult = {
        session,
        sessions: sessionsExceptOauth,
        type,
    };

    return maybePickSessionByEmail({
        api,
        localID,
        email,
        result,
        sessions,
        options,
    });
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
    let persistedSessions = getPersistedSessions().sort((a, b) => {
        return sessionComparator(a, b, localID);
    });

    for (const persistedSession of persistedSessions) {
        try {
            const session = await resumeSession({ api, localID: persistedSession.localID, options });
            return await getActiveSessionsResult({ api, session, localID, email, options });
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
    options: SessionOptions;
}) => {
    const maybePersistedSession = findPersistedSession({
        persistedSessions: getPersistedSessions(),
        UserID: User.ID,
        isSelf: isSelf(User),
        source: options.source ?? defaultSessionOptions.source,
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
