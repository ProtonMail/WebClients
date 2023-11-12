/* eslint-disable @typescript-eslint/no-throw-literal */
import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import type { AuthStore } from '@proton/pass/lib/auth/authentication';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/authentication';
import { AccountForkResponse, consumeFork, getAccountForkResponsePayload } from '@proton/pass/lib/auth/fork';
import type { AuthSession, ExtensionPersistedSession } from '@proton/pass/lib/auth/session';
import {
    SESSION_KEYS,
    encryptPersistedSession,
    isValidPersistedSession,
    isValidSession,
    resumeSession,
} from '@proton/pass/lib/auth/session';
import type { SessionLockCheckResult } from '@proton/pass/lib/auth/session-lock';
import { checkSessionLock } from '@proton/pass/lib/auth/session-lock';
import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { workerLocked, workerLoggedIn, workerLoggedOut, workerReady } from '@proton/pass/lib/worker';
import {
    notification,
    sessionLockSync,
    sessionUnlockFailure,
    sessionUnlockIntent,
    sessionUnlockSuccess,
    stateDestroy,
    stateLock,
} from '@proton/pass/store/actions';
import { selectUser } from '@proton/pass/store/selectors';
import type { Maybe, WorkerMessageResponse } from '@proton/pass/types';
import { AppStatus, SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import type { ForkPayload } from '@proton/pass/types/api/fork';
import { withPayload } from '@proton/pass/utils/fp/lens';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { getApiError, getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import createStore from '@proton/shared/lib/helpers/store';
import noop from '@proton/utils/noop';

import { SSO_URL } from '../../config';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

type AuthInitOptions = { forceLock: boolean };
export interface AuthService {
    store: AuthStore;
    init: (options?: AuthInitOptions) => Promise<boolean>;
    login: (session: AuthSession) => Promise<boolean>;
    logout: () => Promise<boolean>;
    resumeSession: (options?: AuthInitOptions) => Promise<boolean>;
    consumeSession: (data: ForkPayload) => Promise<WorkerMessageResponse<WorkerMessageType.ACCOUNT_FORK>>;
    persistSession: () => Promise<void>;
    getPersistedSession: () => Promise<Maybe<ExtensionPersistedSession>>;
    lock: () => void;
    unlock: (sessionLockToken: string) => Promise<void>;
    syncLock: () => Promise<SessionLockCheckResult>;
}

type CreateAuthServiceOptions = { onAuthorized?: () => void; onUnauthorized?: () => void; onLocked?: () => void };

const SESSION_LOCK_ALARM = 'alarm::session-lock';

export const createAuthService = ({
    onAuthorized,
    onUnauthorized,
    onLocked,
}: CreateAuthServiceOptions): AuthService => {
    /* Provides session data for API handlers and crypto utilities. */
    const authStore = exposeAuthStore(createAuthStore(createStore()));

    const authService: AuthService = {
        store: authStore,

        init: asyncLock(
            withContext<(options?: AuthInitOptions) => Promise<boolean>>(async (ctx, options) => {
                /* if worker is logged out (unauthorized or locked) during an init call,
                 * this means the login or resumeSession calls failed - we can safely early
                 * return as the authentication store will have been configured */
                if (workerLoggedOut(ctx.status)) return false;
                if (workerLoggedIn(ctx.status)) return true;

                logger.info(`[Worker::Auth] Initialization start`);
                return authService.resumeSession(options);
            })
        ),

        login: withContext(async (ctx, session) => {
            api.unsubscribe();

            authStore.setUID(session.UID);
            authStore.setUserID(session.UserID);
            authStore.setLocalID(session.LocalID);
            authStore.setPassword(session.keyPassword);
            authStore.setLockToken(session.sessionLockToken);
            authStore.setAccessToken(session.AccessToken);
            authStore.setRefreshToken(session.RefreshToken);
            authStore.setRefreshTime(session.RefreshTime);

            try {
                const lockStatus = authStore.getLockStatus() ?? (await authService.syncLock()).status;

                if (lockStatus === SessionLockStatus.LOCKED) {
                    logger.info(`[Worker::Auth] Detected locked session`);
                    authService.lock();
                    return false;
                }

                if (lockStatus === SessionLockStatus.REGISTERED && !session.sessionLockToken) {
                    logger.info(`[Worker::Auth] Detected a registered session lock`);
                    authService.lock();
                    return false;
                }
            } catch (error: any) {
                /* if there is an API error on `checkSessionLock` we want to logout
                 * the user only if it is due to a 401 or 403 status response */
                if (getIs401Error(error) || getApiError(error).status === 403) {
                    void authService.logout();
                    return false;
                }
            }

            api.subscribe((event) => {
                switch (event.type) {
                    case 'session': {
                        api.unsubscribe();

                        /* user needs to log back in */
                        if (event.status === 'inactive') {
                            logger.warn(`[Worker::Auth] Inactive session detected`);
                            store.dispatch(notification({ type: 'error', text: c('Warning').t`Please log back in` }));
                            return authService.logout();
                        }

                        /* user needs to enter PIN */
                        if (event.status === 'locked') {
                            store.dispatch(
                                notification({
                                    type: 'error',
                                    text: c('Warning').t`Your session was locked due to inactivity`,
                                })
                            );
                            return authService.lock();
                        }
                    }
                    case 'error': {
                    }
                }
            });

            logger.info(`[Worker::Auth] User is authorized`);
            ctx.setStatus(AppStatus.AUTHORIZED);
            onAuthorized?.();

            return true;
        }),

        logout: withContext(async (ctx) => {
            logger.info(`[Worker::Auth] Logging out...`);
            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(AppStatus.UNAUTHORIZED);
            store.dispatch(stateDestroy());

            void ctx.service.storage.session.clear();
            void ctx.service.storage.local.clear();

            authStore.clear();
            onUnauthorized?.();

            api.unsubscribe();
            void api.reset();

            return true;
        }),

        /* Resumes the session during browser start-up or when not found in session storage.
         * Initializes the authentication store for session resuming API requests. */
        resumeSession: withContext(async (ctx, options) => {
            const inMemorySession = await ctx.service.storage.session.get(SESSION_KEYS);

            if (inMemorySession && isValidSession(inMemorySession)) {
                logger.info(`[Worker::Auth] Resuming from session storage`);
                return authService.login(inMemorySession);
            }

            const persistedSession = await authService.getPersistedSession();

            if (persistedSession) {
                logger.info(`[Worker::Auth] Resuming from local storage`);
                ctx.setStatus(AppStatus.RESUMING);

                try {
                    authStore.setUserID(persistedSession.UserID);
                    authStore.setUID(persistedSession.UID);
                    authStore.setAccessToken(persistedSession.AccessToken);
                    authStore.setRefreshToken(persistedSession.RefreshToken);
                    authStore.setRefreshTime(persistedSession.RefreshTime);

                    const session = await resumeSession({
                        api,
                        authStore,
                        session: persistedSession,
                        onInvalidSession: async () => {
                            authStore.clear();
                            await ctx.service.storage.local.unset(['ps']);
                            await ctx.service.storage.session.clear();
                        },
                    });

                    if (session !== undefined) {
                        logger.info(`[Worker::Auth] Session successfuly resumed`);

                        /* on `forceLock: true` remove the `sessionLockToken` from the
                         * session result to trigger an auth lock during the login sequence */
                        if (options?.forceLock) {
                            logger.info(`[Worker::Auth] Forcing session lock`);
                            delete session.sessionLockToken;
                        }

                        return await authService.login(session);
                    }
                } catch (e) {
                    ctx.setStatus(AppStatus.RESUMING_FAILED);
                    const description = e instanceof Error ? getApiErrorMessage(e) ?? e?.message : '';

                    store.dispatch(
                        notification({
                            type: 'error',
                            text: c('Error').t`Could not resume your session : ${description}`,
                        })
                    );

                    return false;
                }
            }

            ctx.setStatus(AppStatus.UNAUTHORIZED);
            return false;
        }),

        /* Consumes a session fork request, and sends a response to the account app.
         * Depending on the login result, session persistence may occur.
         * If the session is API locked, persist to session storage only. */
        consumeSession: withContext(async (ctx, data) => {
            logger.info(`[Worker::Auth] Consuming session fork...`);
            if (ctx.getState().loggedIn) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);

            try {
                ctx.setStatus(WorkerStatus.AUTHORIZING);

                const session = await consumeFork({ api, apiUrl: `${SSO_URL}/api`, ...data });
                const loggedIn = await authService.login(session);

                if (loggedIn) void authService.persistSession();
                if (workerLocked(ctx.status)) await ctx.service.storage.session.set(session);

                return getAccountForkResponsePayload(AccountForkResponse.SUCCESS);
            } catch (error: any) {
                void authService.logout();
                const additionalMessage = error.message ?? '';

                store.dispatch(
                    notification({
                        type: 'error',
                        text: c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`,
                    })
                );

                throw getAccountForkResponsePayload(AccountForkResponse.ERROR, error);
            }
        }),

        getPersistedSession: withContext<() => Promise<Maybe<ExtensionPersistedSession>>>(async (ctx) => {
            try {
                const { ps } = await ctx.service.storage.local.get(['ps']);

                if (ps) {
                    const session = JSON.parse(ps);
                    return isValidPersistedSession(session) ? session : undefined;
                }
            } catch {
                logger.warn('[Worker::Auth] Failed parsing persisted session');
            }
        }),

        /* Persists the auth session in local and session storage.
         * Session data is kept encrypted in local storage.
         * Session storage is used for session recovery within a browser session. */
        persistSession: withContext(async (ctx) => {
            try {
                logger.info('[Worker::Auth] Persisting session...');

                const session = authStore.getSession();
                if (!isValidSession(session)) throw new Error('Trying to persist invalid session');

                await ctx.service.storage.local.set({ ps: await encryptPersistedSession(api, session) });
                await ctx.service.storage.session.set(session);
            } catch (error) {
                logger.warn(`[Worker::Auth] Persisting session failure`, error);
            }
        }),

        /* set the lock status before dispatching
         * the `stateLock` so the UI can pick up
         * the locked state before wiping the store */
        lock: withContext((ctx) => {
            logger.info(`[Worker::Auth] Locking context`);

            const shouldLockState = workerReady(ctx.status);

            authStore.setLockStatus(SessionLockStatus.LOCKED);
            authStore.setLockToken(undefined);
            authStore.setLockLastExtendTime(undefined);

            api.unsubscribe();
            ctx.setStatus(AppStatus.LOCKED);

            if (shouldLockState) {
                logger.info(`[Worker::Auth] Locking state`);
                store.dispatch(stateLock());
            }

            onLocked?.();
        }),

        /* Updates the `authStore` lock state values & persists
         * them in memory & local persisted sessions */
        unlock: withContext(async (ctx, sessionLockToken) => {
            logger.info(`[Worker::Auth] Unlocking context`);

            ctx.setStatus(AppStatus.RESUMING);
            void api.reset(); /* clear api::state::sessionLocked */

            authStore.setLockToken(sessionLockToken);
            await authService.syncLock();
            await authService.persistSession();
            await authService.init();
        }),

        /* Calling this function when a lock is registered and active
         * will extend the lock by resetting the ttl server-side */
        syncLock: async () => {
            await browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
            const lock = await checkSessionLock();

            authStore.setLockStatus(lock.status);
            authStore.setLockTTL(lock.ttl);
            authStore.setLockLastExtendTime(getEpoch());

            if (lock.status === SessionLockStatus.REGISTERED && lock.ttl) {
                browser.alarms.create(SESSION_LOCK_ALARM, { when: (getEpoch() + lock.ttl) * 1_000 });
            }

            store.dispatch(sessionLockSync(lock));
            return lock;
        },
    };

    const handleUnlockRequest = (request: { pin: string }) =>
        new Promise<WorkerMessageResponse<WorkerMessageType.UNLOCK_REQUEST>>((resolve) => {
            store.dispatch(
                sessionUnlockIntent({ pin: request.pin }, (action) => {
                    if (sessionUnlockSuccess.match(action)) return resolve({ ok: true });
                    if (sessionUnlockFailure.match(action)) return resolve({ ok: false, ...action.payload });
                })
            );
        });

    /* only extend the session lock if a lock is registered and we've reached at least 50%
     * of the lock TTL since the last extension. Calling `AuthService::syncLock` will extend
     * the lock via the `checkSessionLock` call */
    const handleActivityProbe = withContext<MessageHandlerCallback<WorkerMessageType.ACTIVITY_PROBE>>(
        async ({ status }) => {
            const registeredLock = authStore.getLockStatus() === SessionLockStatus.REGISTERED;
            const ttl = authStore.getLockTTL();

            if (workerReady(status) && registeredLock && ttl) {
                const now = getEpoch();
                const diff = now - (authStore.getLockLastExtendTime() ?? 0);

                if (diff > ttl * 0.5) await authService.syncLock();
            }

            return true;
        }
    );

    const resolveUserData = () => ({ user: selectUser(store.getState()) });

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, withPayload(authService.consumeSession));
    WorkerMessageBroker.registerMessage(WorkerMessageType.UNLOCK_REQUEST, withPayload(handleUnlockRequest));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACTIVITY_PROBE, handleActivityProbe);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER_DATA, resolveUserData);

    browser.alarms.onAlarm.addListener((alarm) => alarm.name === SESSION_LOCK_ALARM && authService.lock());

    return authService;
};
