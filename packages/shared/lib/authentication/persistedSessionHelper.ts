import { updateVersionCookie, versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import getRandomValues from '@proton/get-random-values';
import getRandomString from '@proton/utils/getRandomString';

import { getLocalKey, getLocalSessions, setCookies, setLocalKey } from '../api/auth';
import { getIs401Error } from '../api/helpers/apiErrorHelper';
import { InactiveSessionError } from '../api/helpers/withApiHandlers';
import { getUser } from '../api/user';
import { getAppFromPathnameSafe } from '../apps/slugHelper';
import { SECOND, isSSOMode } from '../constants';
import { withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '../helpers/encoding';
import { Api, User as tsUser } from '../interfaces';
import { getIsAuthorizedApp, postMessageFromIframe } from '../sideApp/helpers';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '../sideApp/models';
import { getKey } from './cryptoHelper';
import { InvalidPersistentSessionError } from './error';
import { LocalKeyResponse, LocalSessionResponse } from './interface';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSession,
    getPersistedSessions,
    removePersistedSession,
    setPersistedSession,
    setPersistedSessionWithBlob,
} from './persistedSessionStorage';

export type ResumedSessionResult = {
    UID: string;
    LocalID: number;
    keyPassword?: string;
    User: tsUser;
    persistent: boolean;
};

const handleSideApp = (localID: number) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    let resolve: (arg: undefined | ResumedSessionResult) => void = () => {};
    const promise = new Promise<undefined | ResumedSessionResult>((res) => {
        resolve = res;
    });

    const isIframe = window.self !== window.top;
    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const handler = (event: MessageEvent<SIDE_APP_ACTION>) => {
        if (event.data.type === SIDE_APP_EVENTS.SIDE_APP_SESSION) {
            const { UID, keyPassword, User, persistent, tag } = event.data.payload;
            window.removeEventListener('message', handler);

            if (timeout) {
                clearTimeout(timeout);
            }

            // When opening the side panel, we might need to set the tag of the app we are opening
            // Otherwise we will not open the correct version of the app (default instead of beta or alpha)
            if (tag && versionCookieAtLoad !== tag) {
                updateVersionCookie(tag, undefined);
                window.location.reload();
            }

            resolve({ UID, keyPassword, User, persistent, LocalID: localID });
        }
    };

    if (parentApp && getIsAuthorizedApp(parentApp) && isIframe) {
        postMessageFromIframe({ type: SIDE_APP_EVENTS.SIDE_APP_READY }, parentApp);
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
    const res = await handleSideApp(localID);

    // If we got a res, it means that we are in a side app. We don't need to make the whole resumeSession part
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
