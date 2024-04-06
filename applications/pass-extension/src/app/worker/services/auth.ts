/* eslint-disable @typescript-eslint/no-throw-literal */
import { SSO_URL } from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';
import { c } from 'ttag';

import { SESSION_RESUME_MAX_RETRIES, SESSION_RESUME_RETRY_TIMEOUT } from '@proton/pass/constants';
import { AccountForkResponse, getAccountForkResponsePayload } from '@proton/pass/lib/auth/fork';
import { createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { SESSION_KEYS, isValidPersistedSession } from '@proton/pass/lib/auth/session';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { clientAuthorized, clientReady, clientSessionLocked, clientUnauthorized } from '@proton/pass/lib/client';
import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import {
    cacheCancel,
    notification,
    sessionLockSync,
    sessionUnlockFailure,
    sessionUnlockIntent,
    sessionUnlockSuccess,
    stateDestroy,
    stopEventPolling,
} from '@proton/pass/store/actions';
import type { Api, WorkerMessageResponse } from '@proton/pass/types';
import { AppStatus, SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { FIBONACCI_LIST, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { withContext } from '../context';

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

            /* if worker is logged out (unauthorized or locked) during an init call,
             * this means the login or resumeSession calls failed - we can safely early
             * return as the authentication store will have been configured */
            if (or(clientUnauthorized, clientSessionLocked)(ctx.status)) return false;
            if (clientAuthorized(ctx.status)) return true;
            return ctx.service.auth.resumeSession(undefined, options);
        }),

        getPersistedSession: withContext(async (ctx, _localID) => {
            const ps = await ctx.service.storage.local.getItem('ps');
            if (!ps) return null;

            const persistedSession = JSON.parse(ps);
            return isValidPersistedSession(persistedSession) ? persistedSession : null;
        }),

        getMemorySession: withContext((ctx) => ctx.service.storage.session.getItems(SESSION_KEYS)),

        onAuthorize: withContext((ctx) => {
            browser.alarms.clear(SESSION_RESUME_ALARM).catch(noop);
            ctx.setStatus(AppStatus.AUTHORIZING);
        }),

        onAuthorized: withContext((ctx, _) => {
            ctx.setStatus(AppStatus.AUTHORIZED);
            ctx.service.activation.boot();
            void ctx.service.storage.local.removeItem('forceLock');
            setSentryUID(authStore.getUID());
        }),

        onUnauthorized: withContext((ctx, _) => {
            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(AppStatus.UNAUTHORIZED);

            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());
            store.dispatch(stateDestroy());

            setSentryUID(undefined);

            ctx.service.formTracker.clear();
            ctx.service.onboarding.reset();
            ctx.service.telemetry?.stop();
            ctx.service.autofill.clear();
            ctx.service.apiProxy.clear?.().catch(noop);

            void ctx.service.storage.session.clear();
            void ctx.service.storage.local.clear();

            browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
        }),

        onSessionInvalid: withContext(async (ctx, error, _data) => {
            if (error instanceof InvalidPersistentSessionError) {
                authStore.clear();
                void ctx.service.storage.local.removeItem('ps');
                void ctx.service.storage.session.clear();
            }

            throw error;
        }),

        onSessionEmpty: withContext((ctx) => ctx.setStatus(AppStatus.UNAUTHORIZED)),

        onSessionLockUpdate: withContext(async (ctx, lock) => {
            try {
                store.dispatch(sessionLockSync(lock));

                const { ttl, status } = lock;
                await browser.alarms.clear(SESSION_LOCK_ALARM);
                const ready = clientReady(ctx.getState().status);

                /* To avoid potential issues during the boot sequence, refrain from
                 * setting the `SESSION_LOCK_ALARM` immediately if the session is locked.
                 * This precaution is taken because the boot process might exceed the lock
                 * TTL duration, leading to an unsuccessful boot for the user */
                if (ready && status === SessionLockStatus.REGISTERED && ttl) {
                    browser.alarms.create(SESSION_LOCK_ALARM, { when: epochToMs(getEpoch() + ttl) });
                }
            } catch {}
        }),

        onSessionLocked: withContext((ctx, _offline, _broadcast) => {
            ctx.setStatus(AppStatus.SESSION_LOCKED);
            ctx.service.autofill.clear();

            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());
            store.dispatch(stateDestroy());

            /** set the `forceLock` flag for subsequent auth inits and
             * clear the in-memory session storage */
            void ctx.service.storage.local.setItem('forceLock', true);
            void ctx.service.storage.session.clear();

            browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
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

        onNotification: (data) =>
            store.dispatch(notification({ ...data, type: 'error', key: 'authservice', deduplicate: true })),

        onSessionRefresh: withContext(async (ctx, localID, { AccessToken, RefreshToken, RefreshTime }) => {
            const persistedSession = await ctx.service.auth.config.getPersistedSession(localID);

            if (persistedSession) {
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
        async ({ getState, service, status }, { payload }) => {
            if (getState().loggedIn) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);

            try {
                await authService.consumeFork({ mode: 'secure', ...payload }, `${SSO_URL}/api`);
                if (clientSessionLocked(status)) await service.storage.session.setItems(authStore.getSession());
                return getAccountForkResponsePayload(AccountForkResponse.SUCCESS);
            } catch (error: unknown) {
                authService.logout({ soft: true }).catch(noop);

                const additionalMessage = error instanceof Error ? error.message : '';
                const text = c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`;
                authService.config.onNotification?.({ text });

                throw getAccountForkResponsePayload(AccountForkResponse.ERROR, error);
            }
        }
    );

    const handleUnlock: MessageHandlerCallback<WorkerMessageType.AUTH_UNLOCK> = ({ payload }) =>
        new Promise<WorkerMessageResponse<WorkerMessageType.AUTH_UNLOCK>>((resolve) => {
            store.dispatch(
                sessionUnlockIntent({ pin: payload.pin }, (action) => {
                    if (sessionUnlockSuccess.match(action)) return resolve({ ok: true });
                    if (sessionUnlockFailure.match(action)) return resolve({ ok: false, ...action.payload });
                })
            );
        });

    /* only extend the session lock if a lock is registered and we've reached at least 50%
     * of the lock TTL since the last extension. Calling `AuthService::checkLock` will extend
     * the lock via the `checkSessionLock` call */
    const handleAuthCheck: MessageHandlerCallback<WorkerMessageType.AUTH_CHECK> = withContext(
        async (ctx, { payload: { immediate } }) => {
            try {
                const status = await (async (): Promise<SessionLockStatus> => {
                    if (immediate) return (await authService.checkLock()).status;

                    const lockStatus = authStore.getLockStatus();
                    const registeredLock = lockStatus === SessionLockStatus.REGISTERED;
                    const ttl = authStore.getLockTTL();

                    if (clientReady(ctx.status) && registeredLock && ttl) {
                        const now = getEpoch();
                        const diff = now - (authStore.getLockLastExtendTime() ?? 0);
                        if (diff > ttl * 0.5) return (await authService.checkLock()).status;
                    }

                    return lockStatus ?? SessionLockStatus.NONE;
                })();

                return { ok: true, status };
            } catch {
                return { ok: false, error: null };
            }
        }
    );

    const handlePasswordConfirm: MessageHandlerCallback<WorkerMessageType.AUTH_CONFIRM_PASSWORD> = async (message) => {
        const confirmed = await authService.confirmPassword(message.payload.password);
        return confirmed ? { ok: true } : { ok: false, error: null };
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
                    if (ready) return authService.lock({ soft: false });
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
