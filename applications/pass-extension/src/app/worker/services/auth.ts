/* eslint-disable @typescript-eslint/no-throw-literal */
import { SSO_URL } from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';
import { c } from 'ttag';

import { SESSION_RESUME_MAX_RETRIES, SESSION_RESUME_RETRY_TIMEOUT } from '@proton/pass/constants';
import { AccountForkResponse, getAccountForkResponsePayload } from '@proton/pass/lib/auth/fork';
import { type AuthService, createAuthService as createCoreAuthService } from '@proton/pass/lib/auth/service';
import { SESSION_KEYS, isValidPersistedSession } from '@proton/pass/lib/auth/session';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import { clientAuthorized, clientLocked, clientReady, clientUnauthorized } from '@proton/pass/lib/client';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
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
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { FIBONACCI_LIST, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { withContext } from '../context';

export const SESSION_LOCK_ALARM = 'alarm::session-lock';
export const SESSION_RESUME_ALARM = 'alarm::session-resume';

export const createAuthService = (api: Api, authStore: AuthStore): AuthService => {
    const authService = createCoreAuthService({
        api,
        authStore,
        onInit: withContext(async (ctx, options) => {
            void browser.alarms.clear(SESSION_RESUME_ALARM);

            /* if worker is logged out (unauthorized or locked) during an init call,
             * this means the login or resumeSession calls failed - we can safely early
             * return as the authentication store will have been configured */
            if (clientUnauthorized(ctx.status)) return false;
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
            void browser.alarms.clear(SESSION_RESUME_ALARM);
            ctx.setStatus(AppStatus.AUTHORIZING);
        }),

        onAuthorized: withContext((ctx, _) => {
            ctx.setStatus(AppStatus.AUTHORIZED);
            ctx.service.activation.boot();
            ctx.service.autofill.updateTabsBadgeCount();
            setSentryUID(authStore.getUID());
        }),

        onUnauthorized: withContext((ctx, _) => {
            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());

            /* important to call setStatus before dispatching the
             * the `stateDestroy` action : we might have active
             * clients currently consuming the store data */
            ctx.setStatus(AppStatus.UNAUTHORIZED);
            store.dispatch(stateDestroy());

            setSentryUID(undefined);
            PassCrypto.clear();

            ctx.service.formTracker.clear();
            ctx.service.onboarding.reset();
            ctx.service.telemetry?.stop();
            ctx.service.autofill.clearTabsBadgeCount();
            ctx.service.apiProxy.clear?.().catch(noop);

            void ctx.service.storage.session.clear();
            void ctx.service.storage.local.clear();
            void browser.alarms.clear(SESSION_LOCK_ALARM);
        }),

        onSessionInvalid: withContext((ctx) => {
            authStore.clear();
            void ctx.service.storage.local.remove('ps');
            void ctx.service.storage.session.clear();
        }),

        onSessionEmpty: withContext((ctx) => ctx.setStatus(AppStatus.UNAUTHORIZED)),

        onSessionLockUpdate: async (lock) => {
            try {
                store.dispatch(sessionLockSync(lock));
                const { ttl, status } = lock;
                await browser.alarms.clear(SESSION_LOCK_ALARM);

                if (status === SessionLockStatus.REGISTERED && ttl) {
                    const when = (getEpoch() + ttl) * 1_000;
                    browser.alarms
                        .clear(SESSION_LOCK_ALARM)
                        .then(() => browser.alarms.create(SESSION_LOCK_ALARM, { when }))
                        .catch(noop);
                }
            } catch {}
        },

        onSessionLocked: withContext((ctx, _) => {
            ctx.setStatus(AppStatus.LOCKED);
            ctx.service.autofill.clearTabsBadgeCount();
            PassCrypto.clear();

            store.dispatch(cacheCancel());
            store.dispatch(stopEventPolling());
            store.dispatch(stateDestroy());

            void browser.alarms.clear(SESSION_LOCK_ALARM);
        }),

        onSessionPersist: withContext((ctx, encryptedSession) => {
            void ctx.service.storage.local.setItem('ps', encryptedSession);
            void ctx.service.storage.session.setItems(authStore.getSession());
        }),

        onSessionResumeFailure: withContext(async (ctx, options) => {
            ctx.setStatus(AppStatus.ERROR);

            if (options.retryable) {
                const retryCount = authService.resumeSession.callCount;
                const retryInfo = `(${retryCount}/${SESSION_RESUME_MAX_RETRIES})`;

                if (retryCount <= SESSION_RESUME_MAX_RETRIES) {
                    const retryIdx = Math.min(retryCount, FIBONACCI_LIST.length - 1);
                    const delay = SESSION_RESUME_RETRY_TIMEOUT * FIBONACCI_LIST[retryIdx];
                    const when = (getEpoch() + delay) * 1_000;
                    logger.info(`[AuthService] Retrying session resume in ${delay}s ${retryInfo}`);

                    await browser.alarms.clear(SESSION_RESUME_ALARM);
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

                void ctx.service.storage.local.setItem('ps', JSON.stringify(persistedSession));
                void ctx.service.storage.session.setItems({ AccessToken, RefreshToken, RefreshTime });
            }
        }),
    });

    const handleInit = withContext<MessageHandlerCallback<WorkerMessageType.AUTH_INIT>>(async (ctx, message) => {
        await ctx.service.auth.init(message.options);
        return ctx.getState();
    });

    const handleAccountFork = withContext<MessageHandlerCallback<WorkerMessageType.ACCOUNT_FORK>>(
        async ({ getState, service, status }, { payload }) => {
            if (getState().loggedIn) throw getAccountForkResponsePayload(AccountForkResponse.CONFLICT);

            try {
                await authService.consumeFork({ mode: 'secure', ...payload }, `${SSO_URL}/api`);
                if (clientLocked(status)) await service.storage.session.setItems(authStore.getSession());
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
     * of the lock TTL since the last extension. Calling `AuthService::syncLock` will extend
     * the lock via the `checkSessionLock` call */
    const handleActivityProbe: MessageHandlerCallback<WorkerMessageType.ACTIVITY_PROBE> = withContext(
        async ({ status }) => {
            const registeredLock = authStore.getLockStatus() === SessionLockStatus.REGISTERED;
            const ttl = authStore.getLockTTL();

            if (clientReady(status) && registeredLock && ttl) {
                const now = getEpoch();
                const diff = now - (authStore.getLockLastExtendTime() ?? 0);
                if (diff > ttl * 0.5) await authService.checkLock();
            }

            return true;
        }
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_PROBE, () => true);
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_FORK, handleAccountFork);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_INIT, handleInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTH_UNLOCK, handleUnlock);
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACTIVITY_PROBE, handleActivityProbe);

    browser.alarms.onAlarm.addListener(({ name }) => {
        switch (name) {
            case SESSION_LOCK_ALARM:
                return authService.lock({ soft: false });
            case SESSION_RESUME_ALARM:
                return authService.init({ forceLock: true, retryable: true });
        }
    });

    return authService;
};
