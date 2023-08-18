/* eslint-disable @typescript-eslint/no-throw-literal */
import { captureException as sentryCaptureException } from '@sentry/browser';
import { c } from 'ttag';

import type { AuthStore, ExtensionSession, SessionLockCheckResult } from '@proton/pass/auth';
import {
    SESSION_KEYS,
    checkSessionLock,
    consumeFork,
    createAuthStore,
    exposeAuthStore,
    getInMemorySession,
    getPersistedSession,
    persistSession,
    resumeSession,
    setInMemorySession,
} from '@proton/pass/auth';
import type { MessageHandlerCallback } from '@proton/pass/extension/message';
import { browserLocalStorage, browserSessionStorage } from '@proton/pass/extension/storage';
import {
    notification,
    selectUser,
    sessionUnlockFailure,
    sessionUnlockIntent,
    sessionUnlockSuccess,
    setUserPlan,
    stateDestroy,
    stateLock,
    syncLock,
} from '@proton/pass/store';
import type { Api, WorkerMessageResponse } from '@proton/pass/types';
import { SessionLockStatus, WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import type { ForkPayload } from '@proton/pass/types/api/fork';
import { withPayload } from '@proton/pass/utils/fp';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time';
import { workerLocked, workerReady } from '@proton/pass/utils/worker';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { MAIL_APP_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import createStore from '@proton/shared/lib/helpers/store';

import { SSO_URL } from '../../app/config';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

export interface AuthService {
    store: AuthStore;
    /* auth */
    init: () => Promise<boolean>;
    login: (session: ExtensionSession) => Promise<boolean>;
    logout: () => Promise<boolean>;
    /* session */
    resume: () => Promise<boolean>;
    consume: (data: ForkPayload) => Promise<WorkerMessageResponse<WorkerMessageType.ACCOUNT_FORK>>;
    persist: () => Promise<void>;
    /* lock */
    lock: () => void;
    unlock: (sessionLockToken: string) => Promise<void>;
    syncLock: () => Promise<SessionLockCheckResult>;
}

type CreateAuthServiceOptions = {
    api: Api;
    onAuthorized?: () => void;
    onUnauthorized?: () => void;
    onLocked?: () => void;
};

export const createAuthService = ({
    api,
    onAuthorized,
    onUnauthorized,
    onLocked,
}: CreateAuthServiceOptions): AuthService => {
    const authStore = exposeAuthStore(createAuthStore(createStore()));

    const authService: AuthService = {
        store: authStore,

        init: asyncLock(async () => {
            logger.info(`[Worker::Auth] Initialization start`);

            const inMemorySession = await getInMemorySession();
            return inMemorySession ? authService.login(inMemorySession) : authService.resume();
        }),

        login: withContext(async (ctx, session) => {
            await setInMemorySession(session);

            const { UID, UserID, keyPassword, AccessToken, RefreshToken, sessionLockToken } = session;

            api.configure({ UID, AccessToken, RefreshToken });
            api.unsubscribe();

            authStore.setUID(UID);
            authStore.setUserID(UserID);
            authStore.setPassword(keyPassword);
            authStore.setLockToken(sessionLockToken);

            try {
                const lockStatus = authStore.getLockStatus() ?? (await authService.syncLock()).status;

                if (lockStatus === SessionLockStatus.LOCKED) {
                    logger.info(`[Worker::Auth] Detected locked session`);
                    authService.lock();
                    return false;
                }

                if (lockStatus === SessionLockStatus.REGISTERED && !sessionLockToken) {
                    logger.info(`[Worker::Auth] Detected a registered session lock`);
                    authService.lock();
                    return false;
                }
            } catch (error: any) {
                /* if there is an API error on `checkSessionLock` we want to logout
                 * the user only if it is due to a 401 or 403 status response */
                if (error.name === 'InactiveSession' || getApiError(error).status === 403) {
                    void authService.logout();
                    return false;
                }
            }

            api.subscribe((event) => {
                switch (event.type) {
                    case 'session': {
                        api.unsubscribe();

                        /* inactive session means user needs to log back in */
                        if (event.status === 'inactive') {
                            store.dispatch(
                                notification({
                                    type: 'error',
                                    text: c('Warning').t`Please log back in`,
                                })
                            );

                            return authService.logout();
                        }

                        /* locked session means user needs to enter PIN */
                        if (event.status === 'locked') {
                            authService.lock();

                            return store.dispatch(
                                notification({
                                    type: 'error',
                                    text: c('Warning').t`Your session was locked due to inactivity`,
                                })
                            );
                        }
                    }
                    case 'error': {
                    }
                }
            });

            logger.info(`[Worker::Auth] User is authorized`);
            ctx.setStatus(WorkerStatus.AUTHORIZED);
            onAuthorized?.();

            return true;
        }),

        logout: withContext(async (ctx) => {
            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(WorkerStatus.UNAUTHORIZED);

            store.dispatch(stateDestroy());

            void browserSessionStorage.removeItems(SESSION_KEYS);
            void browserLocalStorage.clear();
            authStore.clear();

            api.unsubscribe();
            api.configure();

            onUnauthorized?.();

            return true;
        }),

        resume: withContext(async (ctx) => {
            logger.info(`[Worker::Auth] Trying to resume session`);
            ctx.setStatus(WorkerStatus.RESUMING);

            const persistedSession = await getPersistedSession();

            if (persistedSession) {
                try {
                    /* Resuming session will most likely happen on browser
                     * start-up before the API has a chance to be configured
                     * through the auth service -> make sure to configure it
                     * with the persisted session authentication parameters
                     * in order for the underlying API calls to succeed and
                     * handle potential token refreshing (ie: persisted access token
                     * expired) */
                    api.configure({
                        UID: persistedSession.UID,
                        AccessToken: persistedSession.AccessToken,
                        RefreshToken: persistedSession.RefreshToken,
                    });

                    const session = await resumeSession({ session: persistedSession, api });

                    if (session !== undefined) {
                        logger.info(`[Worker::Auth] Session successfuly resumed`);
                        return await authService.login(session);
                    }
                } catch (e) {
                    ctx.setStatus(WorkerStatus.RESUMING_FAILED);
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

            ctx.setStatus(WorkerStatus.UNAUTHORIZED);
            return false;
        }),

        /* Consumes a session fork request and sends response.
         * Reset api in case it was in an invalid session state.
         * to see full data flow : `applications/account/src/app/content/PublicApp.tsx` */
        consume: withContext(async (ctx, data) => {
            if (ctx.getState().loggedIn) {
                throw {
                    payload: {
                        title: c('Error').t`Authentication error`,
                        message: c('Info')
                            .t`It seems you are already logged in to ${PASS_APP_NAME}. If you're trying to login with a different account, please logout from the extension first.`,
                    },
                };
            }

            await authService.logout();

            try {
                ctx.setStatus(WorkerStatus.AUTHORIZING);

                const session = await consumeFork({ api, apiUrl: `${SSO_URL}/api`, ...data });
                const loggedIn = await authService.login(session);

                /* if the session is locked we might not be considered
                 * fully logged in but we can still persist the session */
                if (loggedIn || workerLocked(ctx.status)) void authService.persist();

                /* if we get a locked session error on user/access we should not
                 * show a login error : user will have to unlock. FIXME: when
                 * removing the session-lock mechanism (and moving to biometrics)
                 * make sure to catch 403 in this catch block. It is handled by
                 * the session lock check in the AuthService::login call right now */
                await api({ url: `pass/v1/user/access`, method: 'get' })
                    .then(({ Access }) => store.dispatch(setUserPlan({ ...Access!.Plan, requestedAt: getEpoch() })))
                    .catch((e) => {
                        if (!api.getStatus().sessionLocked) throw e;
                    });

                return {
                    payload: {
                        title: c('Title').t`Welcome to ${PASS_APP_NAME}`,
                        message: c('Info')
                            .t`More than a password manager, ${PASS_APP_NAME} protects your password and your personal email address via email aliases. Powered by the same technology behind ${MAIL_APP_NAME}, your data is end to end encrypted and is only accessible by you.`,
                    },
                };
            } catch (error: any) {
                void authService.logout();
                const additionalMessage = error.message ?? '';

                if (error instanceof Error) {
                    /* API errors are excluded from core's sentry `beforeSend`
                     * handler: wrap the error message to by-pass */
                    const loginError = new Error(error.message);
                    loginError.name = 'PassLoginError';
                    loginError.cause = error.cause;
                    loginError.stack = error.stack;

                    sentryCaptureException(loginError, {
                        extra: {
                            forkSelector: data.selector,
                            persistent: data.persistent,
                            trusted: data.trusted,
                        },
                    });
                }

                store.dispatch(
                    notification({
                        type: 'error',
                        text: c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`,
                    })
                );

                throw {
                    payload: {
                        title: error.title ?? c('Error').t`Something went wrong`,
                        message: c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`,
                    },
                };
            }
        }),

        persist: async () => {
            logger.info('[Worker::Auth] Persisting session...');

            const session: ExtensionSession = {
                AccessToken: api.getAuth()!.AccessToken,
                RefreshToken: api.getAuth()!.RefreshToken,
                keyPassword: authStore.getPassword(),
                sessionLockToken: authStore.getLockToken(),
                UID: authStore.getUID()!,
                UserID: authStore.getUserID()!,
            };

            await persistSession(api, session);
        },

        /* set the lock status before dispatching
         * the `stateLock` so the UI can pick up
         * the locked state before wiping the store */
        lock: withContext((ctx) => {
            logger.info(`[Worker::Auth] Locking context`);
            const shouldLockState = workerReady(ctx.status);

            authStore.setLockStatus(SessionLockStatus.LOCKED);
            authStore.setLockToken(undefined);
            authStore.setLockLastExtendTime(undefined);

            ctx.setStatus(WorkerStatus.LOCKED);

            if (shouldLockState) {
                logger.info(`[Worker::Auth] Locking state`);
                store.dispatch(stateLock());
            }

            onLocked?.();
        }),

        /* Updates the `authStore` lock state values & persists
         * them in memory & local persisted sessions */
        unlock: async (sessionLockToken) => {
            logger.info(`[Worker::Auth] Unlocking context`);
            authStore.setLockToken(sessionLockToken);

            await authService.syncLock();
            await authService.persist();
        },

        syncLock: async () => {
            const lock = await checkSessionLock();

            authStore.setLockStatus(lock.status);
            authStore.setLockTTL(lock.ttl);
            authStore.setLockLastExtendTime(getEpoch());

            store.dispatch(syncLock(lock));
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

    /* only extend the session lock if a lock is registered and we've
     * reached at least 50% of the lock TTL since the last extension.
     * Calling `AuthService::syncLock` will extend the lock via the
     * `checkSessionLock` call */
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

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, withPayload(authService.consume));
    WorkerMessageBroker.registerMessage(WorkerMessageType.SESSION_RESUMED, withPayload(authService.login));
    WorkerMessageBroker.registerMessage(WorkerMessageType.UNLOCK_REQUEST, withPayload(handleUnlockRequest));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACTIVITY_PROBE, handleActivityProbe);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER_DATA, resolveUserData);

    return authService;
};
