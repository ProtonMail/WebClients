/* eslint-disable @typescript-eslint/no-throw-literal */
import config from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { safariPullFork, sendSafariMessage } from 'proton-pass-extension/lib/utils/safari';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { SESSION_RESUME_MAX_RETRIES, SESSION_RESUME_RETRY_TIMEOUT } from '@proton/pass/constants';
import { AccountForkResponse, getAccountForkResponsePayload, getStateKey } from '@proton/pass/lib/auth/fork';
import { AppStatusFromLockMode, LockMode } from '@proton/pass/lib/auth/lock/types';
import { ReauthAction } from '@proton/pass/lib/auth/reauth';
import { createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { SESSION_KEYS } from '@proton/pass/lib/auth/session';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import {
    clientAuthorized,
    clientBooted,
    clientReady,
    clientSessionLocked,
    clientUnauthorized,
} from '@proton/pass/lib/client';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import browser from '@proton/pass/lib/globals/browser';
import {
    cacheCancel,
    lockSync,
    notification,
    stateDestroy,
    stopEventPolling,
    unlock,
} from '@proton/pass/store/actions';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { type Api, AppStatus, type MaybeNull } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

export const SESSION_LOCK_ALARM = 'alarm::session-lock';
export const SESSION_RESUME_ALARM = 'alarm::session-resume';

export const getSessionResumeAlarm = () => browser.alarms.get(SESSION_RESUME_ALARM).catch(noop);

export const getSessionResumeDelay = (retryCount: number) => {
    const retryIdx = Math.min(retryCount, FIBONACCI_LIST.length - 1);
    return SESSION_RESUME_RETRY_TIMEOUT * FIBONACCI_LIST[retryIdx];
};

export const shouldForceLock = withContext<() => Promise<boolean>>(async (ctx) => {
    try {
        return (await ctx.service.storage.local.getItem('forceLock')) ?? false;
    } catch {
        return false;
    }
});

export const createAuthService = (api: Api, authStore: AuthStore) => {
    const authService = createCoreAuthService({
        api,
        authStore,
        onInit: withContext(async (ctx, options) => {
            browser.alarms.clear(SESSION_RESUME_ALARM).catch(noop);
            browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);

            if (BUILD_TARGET === 'safari') {
                void sendSafariMessage({ environment: getSecondLevelDomain(config.SSO_URL) });
            }

            /* if worker is logged out (unauthorized or locked) during an init call,
             * this means the login or resumeSession calls failed - we can safely early
             * return as the authentication store will have been configured */
            if (or(clientUnauthorized, clientSessionLocked)(ctx.status)) return false;
            if (clientAuthorized(ctx.status)) return true;
            return ctx.service.auth.resumeSession(undefined, options);
        }),

        ...(BUILD_TARGET === 'safari' ? { pullFork: safariPullFork } : {}),

        getPersistedSession: withContext(async (ctx, _localID) => {
            const ps = await ctx.service.storage.local.getItem('ps');
            if (!ps) return null;

            const persistedSession = JSON.parse(ps);
            return authStore.validPersistedSession(persistedSession) ? persistedSession : null;
        }),

        getMemorySession: withContext((ctx) => ctx.service.storage.session.getItems(SESSION_KEYS)),

        onLoginStart: withContext((ctx) => {
            browser.alarms.clear(SESSION_RESUME_ALARM).catch(noop);
            ctx.setStatus(AppStatus.AUTHORIZING);
        }),

        onLoginComplete: withContext((ctx, _) => {
            ctx.setStatus(AppStatus.AUTHORIZED);
            ctx.service.activation.boot();
            void ctx.service.storage.local.removeItem('forceLock');
            setSentryUID(authStore.getUID());

            if (BUILD_TARGET === 'safari') void sendSafariMessage({ credentials: authStore.getSession() });
        }),

        onLogoutComplete: withContext((ctx, _) => {
            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(AppStatus.UNAUTHORIZED);

            ctx.service.store.dispatch(cacheCancel());
            ctx.service.store.dispatch(stopEventPolling());
            ctx.service.store.dispatch(stateDestroy());

            setSentryUID(undefined);

            ctx.service.formTracker.clear();
            ctx.service.spotlight.reset();
            ctx.service.telemetry?.stop();
            ctx.service.autofill.clear();
            ctx.service.apiProxy.clear?.().catch(noop);
            ctx.service.settings.broadcast(getInitialSettings());
            ctx.service.logger.clear().catch(noop);

            void ctx.service.storage.session.clear();
            void ctx.service.storage.local.clear();
            void fileStorage.clearAll();

            browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
            if (BUILD_TARGET === 'safari') sendSafariMessage({ credentials: null }).catch(noop);
        }),

        onForkConsumeStart: async () => {
            /** Block fork consumption if the extension is already authenticated */
            if (authStore.hasSession()) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);
            else await authService.config.onLoginStart?.();
        },

        onForkReauth: async (data, state) => {
            switch (data.reauth.type) {
                case ReauthAction.SSO_EXPORT:
                    const path = `/settings.html#export?state=${state}`;
                    await browser.tabs.create({ url: browser.runtime.getURL(path) });
                    return true;

                default:
                    return true;
            }
        },

        onSessionInvalid: withContext(async (ctx, error, _data) => {
            if (error instanceof InvalidPersistentSessionError) {
                authStore.clear();
                void ctx.service.storage.local.removeItem('ps');
                void ctx.service.storage.session.clear();
            }

            throw error;
        }),

        onSessionEmpty: withContext((ctx) => ctx.setStatus(AppStatus.UNAUTHORIZED)),

        onLockUpdate: withContext(async (ctx, lock) => {
            try {
                ctx.service.store.dispatch(lockSync(lock));

                const { ttl, mode } = lock;
                await browser.alarms.clear(SESSION_LOCK_ALARM);
                const ready = clientReady(ctx.getState().status);

                /* To avoid potential issues during the boot sequence, refrain from
                 * setting the `SESSION_LOCK_ALARM` immediately if the session is locked.
                 * This precaution is taken because the boot process might exceed the lock
                 * TTL duration, leading to an unsuccessful boot for the user */
                if (ready && mode !== LockMode.NONE && ttl) {
                    const when = epochToMs(getEpoch() + ttl);
                    browser.alarms.create(SESSION_LOCK_ALARM, { when });
                }
            } catch {}
        }),

        onLocked: withContext((ctx, mode, _localID, _broadcast) => {
            ctx.setStatus(AppStatusFromLockMode[mode]);
            ctx.service.autofill.clear();

            ctx.service.store.dispatch(cacheCancel());
            ctx.service.store.dispatch(stopEventPolling());
            ctx.service.store.dispatch(stateDestroy());

            /** set the `forceLock` flag for subsequent auth inits and
             * clear the in-memory session storage */
            void ctx.service.storage.local.setItem('forceLock', true);
            void ctx.service.storage.session.removeItems(SESSION_KEYS);

            browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
        }),

        onUnlocked: withContext(async (ctx, mode, _, localID) => {
            if (clientBooted(ctx.getState().status)) return;

            if (mode === LockMode.SESSION) {
                /** If the unlock request was triggered before the authentication
                 * store session was fully hydrated, trigger a session resume. */
                const validSession = authStore.validSession(authStore.getSession());
                if (!validSession) await authService.resumeSession(localID, { retryable: false, unlocked: true });
                else await authService.login(authStore.getSession(), { unlocked: true });
            }
        }),

        onSessionPersist: withContext(async (ctx, encryptedSession) => {
            void ctx.service.storage.local.setItem('ps', encryptedSession);
            void ctx.service.storage.session.setItems(authStore.getSession());
        }),

        onSessionFailure: withContext(async (ctx, options) => {
            ctx.setStatus(AppStatus.ERROR);

            if (options.retryable) {
                const retryCount = authService.resumeSession.callCount;
                const retryInfo = `(${retryCount}/${SESSION_RESUME_MAX_RETRIES})`;

                if (retryCount <= SESSION_RESUME_MAX_RETRIES) {
                    const delay = getSessionResumeDelay(retryCount);
                    const when = epochToMs(getEpoch() + delay);
                    logger.info(`[AuthService] Retrying session resume in ${delay}s ${retryInfo}`);

                    await browser.alarms.clear(SESSION_RESUME_ALARM).catch(noop);
                    browser.alarms.create(SESSION_RESUME_ALARM, { when });
                } else logger.info(`[AuthService] Reached max number of resume retries ${retryInfo}`);
            }
        }),

        onNotification: withContext((ctx, data) =>
            ctx.service.store.dispatch(
                notification({
                    ...data,
                    type: 'error',
                    key: data.key ?? 'authservice',
                    deduplicate: true,
                })
            )
        ),

        onMissingScope: withContext((ctx) => ctx.setStatus(AppStatus.MISSING_SCOPE)),

        onSessionRefresh: withContext(async (ctx, localID, { AccessToken, RefreshToken, RefreshTime }) => {
            const persistedSession = await ctx.service.auth.config.getPersistedSession(localID);

            if (persistedSession) {
                if (BUILD_TARGET === 'safari') {
                    const refreshCredentials = { AccessToken, RefreshToken, RefreshTime };
                    void sendSafariMessage({ refreshCredentials });
                }

                /* update the persisted session tokens without re-encrypting the
                 * session blob as session refresh may happen before a full login
                 * with a partially hydrated authentication store. */
                persistedSession.AccessToken = AccessToken;
                persistedSession.RefreshToken = RefreshToken;
                persistedSession.RefreshTime = RefreshTime;

                await ctx.service.storage.local.setItem('ps', JSON.stringify(persistedSession));
                void ctx.service.storage.session.setItems({ AccessToken, RefreshToken, RefreshTime });
            }
        }),
    });

    const handleInit = withContext<MessageHandlerCallback<WorkerMessageType.AUTH_INIT>>(async (ctx, { options }) => {
        options.forceLock = await shouldForceLock();
        await ctx.service.auth.init(options);
        return ctx.getState();
    });

    const handleAccountFork = withContext<MessageHandlerCallback<WorkerMessageType.ACCOUNT_FORK>>(
        async ({ service, status }, { payload }, { tab }) => {
            try {
                const stateKey = getStateKey(payload.state);
                const localState: MaybeNull<string> = await service.storage.session
                    .getItem<any>(stateKey)
                    .catch(() => null);

                const result = await authService.consumeFork(
                    { mode: 'extension', tabId: tab?.id!, localState, ...payload },
                    `${config.SSO_URL}/api`
                );

                if (result.reauth) {
                    /** On fork reauth remove the account tab to  avoid `/auth-ext`
                     * onboarding redirection. At this point, the extension may be
                     * locked causing the reauth action to be lost. */
                    if (tab?.id) await browser.tabs.remove(tab.id);
                    return getAccountForkResponsePayload(AccountForkResponse.REAUTH);
                }

                if (clientSessionLocked(status)) await service.storage.session.setItems(authStore.getSession());
                return getAccountForkResponsePayload(AccountForkResponse.SUCCESS);
            } catch (error: unknown) {
                if (!(error instanceof Error)) throw error;
                throw getAccountForkResponsePayload(AccountForkResponse.ERROR, error);
            }
        }
    );

    const handleUnlock: MessageHandlerCallback<WorkerMessageType.AUTH_UNLOCK> = withContext((ctx, { payload }) =>
        ctx.service.store.dispatchAsyncRequest(unlock, payload).then((res) => {
            switch (res.type) {
                case 'success':
                    return { ok: true };
                case 'failure':
                    return { ok: false, error: res.error };
            }
        })
    );

    /* only extend the session lock if a lock is registered and we've reached at least 50%
     * of the lock TTL since the last extension. Calling `AuthService::checkLock` will extend
     * the lock via the `checkLock` call */
    const handleAuthCheck: MessageHandlerCallback<WorkerMessageType.AUTH_CHECK> = withContext(
        async (ctx, { payload: { immediate } }) => {
            try {
                const locked = await (async (): Promise<boolean> => {
                    if (immediate) return (await authService.checkLock()).locked;

                    const lockMode = authStore.getLockMode();
                    const registeredLock = lockMode !== LockMode.NONE;
                    const ttl = authStore.getLockTTL();

                    if (clientReady(ctx.status) && registeredLock && ttl) {
                        const now = getEpoch();
                        const diff = now - (authStore.getLockLastExtendTime() ?? 0);
                        if (diff > ttl * 0.5) return (await authService.checkLock()).locked;
                    }

                    return authStore.getLocked() ?? false;
                })();

                return { ok: true, locked };
            } catch {
                return { ok: false };
            }
        }
    );

    const handlePasswordConfirm: MessageHandlerCallback<WorkerMessageType.AUTH_CONFIRM_PASSWORD> = async (message) => {
        const confirmed = await authService.confirmPassword(message.payload.password);
        return { ok: confirmed };
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_PROBE, () => true);
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, handleAccountFork);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_CHECK, handleAuthCheck);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_CONFIRM_PASSWORD, handlePasswordConfirm);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_INIT, handleInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_UNLOCK, handleUnlock);

    /** These alarms may be triggered while the service worker was idle,
     * as such, we should check for the app status before triggering any effects
     * that would make API calls to avoid unauthenticated requests being sent out */
    browser.alarms.onAlarm.addListener(
        withContext(async (ctx, { name }) => {
            switch (name) {
                case SESSION_LOCK_ALARM: {
                    const ready = clientReady(ctx.getState().status);
                    logger.info(`[AuthService] session lock alarm detected [ready=${ready}]`);
                    await ctx.service.storage.local.setItem('forceLock', true);
                    if (ready) return authService.lock(LockMode.SESSION, { soft: false });
                    else return authService.init({ forceLock: true, retryable: false });
                }
                case SESSION_RESUME_ALARM: {
                    logger.info(`[AuthService] session resume alarm detected`);
                    return authService.init({ forceLock: await shouldForceLock(), retryable: true });
                }
            }
        })
    );

    return authService;
};
