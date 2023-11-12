import { c } from 'ttag';

import type { Maybe, MaybeNull, MaybePromise } from '@proton/pass/types';
import { type Api, SessionLockStatus } from '@proton/pass/types';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { revoke } from '@proton/shared/lib/api/auth';
import { getApiError, getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import noop from '@proton/utils/noop';

import { type RefreshSessionData } from '../api/refresh';
import {
    type ConsumeForkPayload,
    type RequestForkOptions,
    type RequestForkResult,
    consumeFork,
    requestFork,
} from './fork';
import {
    type AuthSession,
    type PersistedAuthSession,
    encryptPersistedSession,
    isValidSession,
    resumeSession,
} from './session';
import type { SessionLockCheckResult } from './session-lock';
import {
    checkSessionLock,
    createSessionLock,
    deleteSessionLock,
    forceSessionLock,
    unlockSession,
} from './session-lock';
import { type AuthStore } from './store';

export interface AuthServiceOptions {
    api: Api;
    /** Store holding the active session data */
    authStore: AuthStore;
    /** The in-memory session is used to store the session data securely.
     * It allows resuming a session without any API calls to re-authenticate.
     * In most cases you can omit the implementation and rely on the `authStore` */
    getMemorySession?: () => MaybePromise<any>;
    /** The persisted session will be parsed and decrypted to extract the
     * session data. Requires an API call to retrieve the local key. */
    getPersistedSession: (localID?: number) => MaybePromise<MaybeNull<PersistedAuthSession>>;
    /**  Implement any service initialization logic in this hook. Should return
     * a boolean flag indicating wether user was authorized or not. */
    onInit: (options?: { forceLock: boolean }) => Promise<boolean>;
    /** Called when authorization sequence starts: this can happen when consuming a
     * session fork or when trying to resume a session. */
    onAuthorize?: () => void;
    /** Called whenever a user is successfully authenticated. This can happen
     * after consuming a fork or resuming a session.  */
    onAuthorized?: (localID?: number) => void;
    /** Called whenever a user is unauthenticated. This will be triggered any time
     * the `logout` function is called (either via user action or when an inactive
     * session is detected). */
    onUnauthorized?: (localID?: number) => void;
    /** Called immediately after a fork has been successfully consumed. At this
     * point the user is not fully logged in yet. */
    onForkConsumed?: (session: AuthSession) => void;
    /** Called when a fork could not be successfully consumed. This can happen
     * if the fork data is invalid */
    onForkInvalid?: () => void;
    /** Handle the result of a fork request call. Can be used to redirect the
     * user automatically when requesting a fork from account. */
    onForkRequest?: (result: RequestForkResult) => void;
    /** Called when an invalid persistent session error is thrown during a
     * session resuming sequence. */
    onSessionInvalid?: () => void;
    /* Called when no persisted session or in-memory session can be used to
     * resume a session. */
    onSessionEmpty?: () => void;
    /** Called when a session is locked either through user action or when a
     * locked session is detected. */
    onSessionLocked?: () => void;
    /* Callback on session lock check. By default, this will be triggered
     * on every login sequence. */
    onSessionLockCheck?: (data: SessionLockCheckResult) => void;
    /** Called with the `sessionLockToken` when session is successfully unlocked */
    onSessionUnlocked?: (sessionLockToken: string) => void;
    /** Implement encrypted local session persistence using this hook. Called on every
     * successful consumed fork or unlocked session. */
    onSessionPersist?: (encryptedSession: string) => MaybePromise<void>;
    /** Called when resuming the session failed for any reason excluding inactive
     * session error. */
    onSessionResumeFailure?: () => void;
    /** Called when session tokens have been refreshed  */
    onSessionRefresh?: (data: RefreshSessionData) => MaybePromise<void>;
    /** Implement how you want to handle notifications emitted from the service */
    onNotification?: (reason: string) => void;
}

export const createAuthService = ({
    api,
    authStore,
    getMemorySession,
    getPersistedSession,
    onAuthorize,
    onAuthorized,
    onInit,
    onForkConsumed,
    onForkInvalid,
    onForkRequest,
    onNotification,
    onSessionEmpty,
    onSessionInvalid,
    onSessionLockCheck,
    onSessionLocked,
    onSessionPersist,
    onSessionRefresh,
    onSessionResumeFailure,
    onSessionUnlocked,
    onUnauthorized,
}: AuthServiceOptions) => {
    const authService = {
        init: asyncLock((options?: { forceLock: boolean }) => {
            logger.info(`[AuthService] Initialization start`);
            return onInit(options).catch((err) => {
                logger.warn(`[AuthService] Initialization failure`, err);
                return false;
            });
        }),

        getPersistedSession,

        /** Removes any ongoing API listeners and starts listening for
         * authentication relevant API messages.*/
        listen: () => {
            api.unsubscribe();
            api.subscribe((event) => {
                switch (event.type) {
                    case 'session': {
                        api.unsubscribe();

                        if (event.status === 'inactive') {
                            onNotification?.(c('Warning').t`Your session is inactive. Please log back in.`);
                            return authService.logout({ soft: true });
                        }

                        if (event.status === 'locked') {
                            onNotification?.(c('Warning').t`Your session was locked due to inactivity.`);
                            return authService.lock({ soft: true });
                        }

                        break;
                    }

                    case 'refresh': {
                        const { data } = event;
                        authStore.setAccessToken(data.AccessToken);
                        authStore.setRefreshToken(data.RefreshToken);
                        authStore.setUID(data.UID);
                        authStore.setRefreshTime(data.RefreshTime);
                        void onSessionRefresh?.(data);
                    }
                }
            });
        },

        login: async (session: AuthSession) => {
            authStore.setUID(session.UID);
            authStore.setUserID(session.UserID);
            authStore.setLocalID(session.LocalID);
            authStore.setPassword(session.keyPassword);
            authStore.setLockToken(session.sessionLockToken);
            authStore.setAccessToken(session.AccessToken);
            authStore.setRefreshToken(session.RefreshToken);
            authStore.setRefreshTime(session.RefreshTime);

            authService.listen();

            try {
                const lockStatus = authStore.getLockStatus() ?? (await authService.checkLock()).status;

                if (lockStatus === SessionLockStatus.LOCKED) {
                    logger.info(`[AuthService] Detected locked session`);
                    await authService.lock({ soft: true });
                    return false;
                }

                if (lockStatus === SessionLockStatus.REGISTERED && !session.sessionLockToken) {
                    logger.info(`[AuthService] Detected a registered session lock`);
                    await authService.lock({ soft: true });
                    return false;
                }
            } catch (error: any) {
                /* if there is an API error on `checkSessionLock` we want to logout
                 * the user only if it is due to a 401 or 403 status response */
                if (getIs401Error(error) || getApiError(error).status === 403) {
                    void authService.logout({ soft: true });
                    return false;
                }
            }

            logger.info(`[AuthService] User is authorized`);
            onAuthorized?.(authStore.getLocalID());

            return true;
        },

        logout: async (options: { soft: boolean }) => {
            logger.info(`[AuthService] User is not authorized`);

            const localID = authStore.getLocalID();
            if (!options?.soft) void api({ ...revoke(), silent: true });

            authStore.clear();
            api.unsubscribe();
            await api.reset();

            onUnauthorized?.(localID);

            return true;
        },

        consumeFork: async (payload: ConsumeForkPayload): Promise<boolean> => {
            try {
                onAuthorize?.();
                const session = await consumeFork({ api, payload });
                onForkConsumed?.(session);

                const loggedIn = await authService.login(session);
                if (loggedIn) await authService.persistSession();

                return loggedIn;
            } catch (error: unknown) {
                onNotification?.(c('Warning').t`Your session could not be authorized.`);
                onForkInvalid?.();
                await authService.logout({ soft: true });

                return false;
            }
        },

        requestFork: (options: RequestForkOptions): RequestForkResult => {
            const result = requestFork(options);
            onForkRequest?.(result);

            return result;
        },

        /** Creates a session lock. Automatically updates the authentication
         * store and immediately persists the session on success. */
        createLock: async (lockCode: string, sessionLockTTL: number) => {
            const sessionLockToken = await createSessionLock(lockCode, sessionLockTTL);

            authStore.setLockToken(sessionLockToken);
            authStore.setLockTTL(sessionLockTTL);
            authStore.setLockStatus(SessionLockStatus.REGISTERED);

            void authService.persistSession();
        },

        /** Deletes a registered session lock. Requires the session lock code.
         * Immediately persists the session on success. */
        deleteLock: async (lockCode: string) => {
            await deleteSessionLock(lockCode);

            authStore.setLockToken(undefined);
            authStore.setLockTTL(undefined);
            authStore.setLockStatus(SessionLockStatus.NONE);

            void authService.persistSession();
        },

        lock: async (options: { soft: boolean }): Promise<void> => {
            logger.info(`[AuthService] Locking session [soft: ${options.soft}]`);
            if (!options?.soft) await forceSessionLock().catch(noop);

            api.unsubscribe();
            authStore.setLockStatus(SessionLockStatus.LOCKED);
            authStore.setLockToken(undefined);
            authStore.setLockLastExtendTime(undefined);

            onSessionLocked?.();
        },

        unlock: async (pin: string): Promise<void> => {
            try {
                logger.info(`[AuthService] Unlocking session`);
                await api.reset();
                authService.listen();

                const sessionLockToken = await unlockSession(pin);
                authStore.setLockToken(sessionLockToken);

                await authService.checkLock();
                await authService.persistSession();
                await authService.login(authStore.getSession());

                onSessionUnlocked?.(sessionLockToken);
            } catch (error: unknown) {
                /* if the session is inactive at this point, it likely means the user
                 * reached the maximum amount of unlock attempts. Error is thrown so
                 * clients can react. */
                if (api.getState().sessionInactive) void authService.logout({ soft: true });
                else void authService.lock({ soft: true });

                throw error;
            }
        },

        /* Calling this function when a lock is registered and active
         * will extend the lock by resetting the ttl server-side */
        checkLock: async () => {
            logger.info('[AuthService] Checking session lock status');
            const lock = await checkSessionLock();

            authStore.setLockStatus(lock.status);
            authStore.setLockTTL(lock.ttl);
            authStore.setLockLastExtendTime(getEpoch());

            onSessionLockCheck?.(lock);
            return lock;
        },

        persistSession: async () => {
            try {
                logger.info('[AuthService] Persisting session');

                const session = authStore.getSession();
                if (!isValidSession(session)) throw new Error('Trying to persist invalid session');

                const encryptedSession = await encryptPersistedSession(api, session);
                await onSessionPersist?.(encryptedSession);
            } catch (error) {
                logger.warn(`[AuthService] Persisting session failure`, error);
            }
        },

        resumeSession: async (localID: Maybe<number>, options?: { forceLock: boolean }): Promise<boolean> => {
            const memorySession = await getMemorySession?.();

            if (memorySession && isValidSession(memorySession)) {
                logger.info(`[Worker::Auth] Resuming in-memory session`);
                return authService.login(memorySession);
            }

            try {
                const persistedSession = await getPersistedSession(localID);

                if (!persistedSession) {
                    logger.info(`[AuthService] No persisted session found`);
                    onSessionEmpty?.();
                    return false;
                }

                logger.info(`[AuthService] Resuming persisted session.`);
                onAuthorize?.();

                authStore.setUserID(persistedSession.UserID);
                authStore.setUID(persistedSession.UID);
                authStore.setLocalID(persistedSession.LocalID);
                authStore.setAccessToken(persistedSession.AccessToken);
                authStore.setRefreshToken(persistedSession.RefreshToken);
                authStore.setRefreshTime(persistedSession.RefreshTime);

                authService.listen();
                const session = await resumeSession({ api, authStore, persistedSession, onSessionInvalid });
                logger.info(`[AuthService] Session successfuly resumed`);

                /* on `forceLock: true` remove the `sessionLockToken` from the
                 * session result to trigger an auth lock during the login sequence */
                if (options?.forceLock) {
                    logger.info(`[AuthService] Forcing session lock`);
                    delete session.sessionLockToken;
                }

                return await authService.login(session);
            } catch (error: unknown) {
                const reason = error instanceof Error ? getApiErrorMessage(error) ?? error?.message : '';
                logger.warn(`[AuthService] Resuming session failed (${reason})`);
                onNotification?.(c('Warning').t`Your session could not be resumed.`);

                /* if session is inactive : trigger unauthorized sequence */
                if (api.getState().sessionInactive) await authService.logout({ soft: true });
                else onSessionResumeFailure?.();

                return false;
            }
        },
    };

    return authService;
};

export type AuthService = ReturnType<typeof createAuthService>;
