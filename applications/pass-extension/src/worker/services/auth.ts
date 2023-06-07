/* eslint-disable @typescript-eslint/no-throw-literal */
import { c } from 'ttag';

import {
    checkSessionLock,
    consumeFork,
    exposeAuthStore,
    getPersistedSession,
    persistSession,
    resumeSession,
} from '@proton/pass/auth';
import { browserLocalStorage, browserSessionStorage } from '@proton/pass/extension/storage';
import { notification, selectSessionLockToken, setUserPlan, stateDestroy, stateLock } from '@proton/pass/store';
import type { AccountForkMessage, Api, MaybeNull, WorkerMessageResponse } from '@proton/pass/types';
import { SessionLockStatus, WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import { withPayload } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time';
import { workerReady } from '@proton/pass/utils/worker';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import createAuthenticationStore from '@proton/shared/lib/authentication/createAuthenticationStore';
import { MAIL_APP_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import createStore from '@proton/shared/lib/helpers/store';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

type LoginOptions = {
    UID: string;
    AccessToken: string;
    RefreshToken: string;
    keyPassword: string;
};
export interface AuthService {
    authStore: AuthenticationStore;
    resumeSession: () => Promise<boolean>;
    consumeFork: (
        data: AccountForkMessage['payload']
    ) => Promise<WorkerMessageResponse<WorkerMessageType.ACCOUNT_FORK>>;
    login: (options: LoginOptions) => Promise<boolean>;
    logout: () => Promise<boolean>;
    init: () => Promise<boolean>;
    lock: () => void;
    unlock: () => void;
}

type CreateAuthServiceOptions = {
    api: Api;
    onAuthorized?: () => void;
    onUnauthorized?: () => void;
    onLocked?: () => void;
};

type AuthContext = {
    pendingInit: MaybeNull<Promise<boolean>>;
    lockStatus: MaybeNull<SessionLockStatus>;
};

export const createAuthService = ({
    api,
    onAuthorized,
    onUnauthorized,
    onLocked,
}: CreateAuthServiceOptions): AuthService => {
    const authCtx: AuthContext = { pendingInit: null, lockStatus: null };

    const authService: AuthService = {
        authStore: exposeAuthStore(createAuthenticationStore(createStore())),

        lock: withContext((ctx) => {
            logger.info(`[Worker::Auth] Locking context`);
            const shouldLockState = workerReady(ctx.status);

            /* set the lock status before dispatching
             * the `stateLock` so the UI can pick up
             * the locked state before wiping the store */
            authCtx.lockStatus = SessionLockStatus.LOCKED;
            ctx.setStatus(WorkerStatus.LOCKED);

            if (shouldLockState) {
                logger.info(`[Worker::Auth] Locking state`);
                store.dispatch(stateLock());
            }

            onLocked?.();
        }),

        unlock: () => {
            logger.info(`[Worker::Auth] Unlocking context`);
            authCtx.lockStatus = SessionLockStatus.REGISTERED;
        },

        init: async () => {
            logger.info(`[Worker::Auth] Initialization start`);

            if (authCtx.pendingInit !== null) {
                logger.info(`[Worker::Auth] Ongoing auth initialization..`);
                return authCtx.pendingInit;
            }

            authCtx.pendingInit = Promise.resolve(
                (async () => {
                    const { UID, AccessToken, RefreshToken, keyPassword } = await browserSessionStorage.getItems([
                        'UID',
                        'AccessToken',
                        'RefreshToken',
                        'keyPassword',
                    ]);

                    if (UID && keyPassword && AccessToken && RefreshToken) {
                        return authService.login({ UID, keyPassword, AccessToken, RefreshToken });
                    }

                    return authService.resumeSession();
                })()
            );

            const result = await authCtx.pendingInit;
            authCtx.pendingInit = null;

            return result;
        },
        /* Consumes a session fork request and sends response.
         * Reset api in case it was in an invalid session state.
         * to see full data flow : `applications/account/src/app/content/PublicApp.tsx` */
        consumeFork: withContext(async (ctx, data) => {
            await authService.logout();

            try {
                ctx.setStatus(WorkerStatus.AUTHORIZING);

                const { keyPassword } = data;
                const result = await consumeFork({ api, ...data });

                const { AccessToken, RefreshToken } = result;

                const loggedIn = await authService.login({ UID: result.UID, AccessToken, RefreshToken, keyPassword });

                /* if the session is locked we might not be considered
                 * fully logged in but we can still persist the session */
                if (loggedIn || api.getStatus().sessionLocked) {
                    logger.info('[Worker::Auth] Persisting session...');
                    void persistSession(api, result);
                }

                /* the `/pass/v1/user/session/lock/check` may have failed during
                 * the login call : this indicates that the user is not white-listed */
                if (!loggedIn && !api.getStatus().sessionLocked) {
                    throw {
                        title: c('Title').t`Unauthorized access`,
                        message: c('Info').t`${PASS_APP_NAME} is currently under a closed beta. Come back later.`,
                    };
                }

                /* if we get a locked session error on user/access we should not
                 * show a login error : user will have to unlock. FIXME: when
                 * removing the session-lock mechanism (and moving to biometrics)
                 * make sure to catch 403 in this catch block. It is handled by
                 * the session lock check in the AuthService::login call right now */
                const accessResponse = await api({ url: `pass/v1/user/access`, method: 'post' }).catch((e) => {
                    if (!api.getStatus().sessionLocked) {
                        throw e;
                    }
                });

                if (accessResponse?.Access) {
                    store.dispatch(setUserPlan({ ...accessResponse.Access.Plan, requestedAt: getEpoch() }));
                }

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

        login: withContext(async (ctx, options) => {
            const { UID, keyPassword, AccessToken, RefreshToken } = options;
            await browserSessionStorage.setItems({ UID, keyPassword, AccessToken, RefreshToken });

            api.configure({ UID, AccessToken, RefreshToken });
            api.unsubscribe();

            authService.authStore.setUID(UID);
            authService.authStore.setPassword(keyPassword);

            try {
                const cachedLockStatus = authCtx.lockStatus;
                const lock = cachedLockStatus !== null ? { status: cachedLockStatus } : await checkSessionLock();
                authCtx.lockStatus = lock.status;

                if (lock.status === SessionLockStatus.LOCKED) {
                    logger.info(`[Worker::Auth] Detected locked session`);
                    authService.lock();
                    return false;
                }

                if (lock.status === SessionLockStatus.REGISTERED && !selectSessionLockToken(store.getState())) {
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

                            store.dispatch(
                                notification({
                                    type: 'error',
                                    text: c('Warning').t`Your session was locked due to inactivity`,
                                })
                            );

                            return;
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
            void browserSessionStorage.removeItems(['AccessToken', 'RefreshToken', 'UID', 'keyPassword']);
            void browserLocalStorage.clear();

            authCtx.lockStatus = null;
            authService.authStore.setUID(undefined);
            authService.authStore.setPassword(undefined);

            api.unsubscribe();
            api.configure();

            onUnauthorized?.();

            return true;
        }),

        resumeSession: withContext(async (ctx) => {
            logger.info(`[Worker::Auth] Trying to resume session`);
            ctx.setStatus(WorkerStatus.RESUMING);

            const persistedSession = await getPersistedSession();

            if (persistedSession) {
                try {
                    /**
                     * Resuming session will most likely happen on browser
                     * start-up before the API has a chance to be configured
                     * through the auth service -> make sure to configure it
                     * with the persisted session authentication parameters
                     * in order for the underlying API calls to succeed and
                     * handle potential token refreshing (ie: persisted access token
                     * expired)
                     */
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
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, withPayload(authService.consumeFork));
    WorkerMessageBroker.registerMessage(WorkerMessageType.SESSION_RESUMED, withPayload(authService.login));

    return authService;
};
