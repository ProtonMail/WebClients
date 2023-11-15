import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { createActivationService } from 'proton-pass-extension/app/worker/services/activation';
import { createAliasService } from 'proton-pass-extension/app/worker/services/alias';
import { SESSION_LOCK_ALARM, createAuthService } from 'proton-pass-extension/app/worker/services/auth';
import { createAutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import { createAutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
import { createCacheProxyService } from 'proton-pass-extension/app/worker/services/cache-proxy';
import { createExportService } from 'proton-pass-extension/app/worker/services/export';
import { createFormTrackerService } from 'proton-pass-extension/app/worker/services/form.tracker';
import { createI18nService } from 'proton-pass-extension/app/worker/services/i18n';
import { createInjectionService } from 'proton-pass-extension/app/worker/services/injection';
import { createLoggerService } from 'proton-pass-extension/app/worker/services/logger';
import { createOnboardingService } from 'proton-pass-extension/app/worker/services/onboarding';
import { createOTPService } from 'proton-pass-extension/app/worker/services/otp';
import { createSettingsService } from 'proton-pass-extension/app/worker/services/settings';
import { createStorageService } from 'proton-pass-extension/app/worker/services/storage';
import { createStoreService } from 'proton-pass-extension/app/worker/services/store';
import { createTelemetryService } from 'proton-pass-extension/app/worker/services/telemetry';
import { setPopupIcon } from 'proton-pass-extension/lib/utils/popup-icon';
import { getExtensionVersion } from 'proton-pass-extension/lib/utils/version';

import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { SESSION_KEYS, isValidPersistedSession } from '@proton/pass/lib/auth/session';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import {
    clientAuthorized,
    clientErrored,
    clientLocked,
    clientReady,
    clientStale,
    clientStatusResolved,
    clientUnauthorized,
} from '@proton/pass/lib/client';
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { notification, sessionLockSync, stateDestroy, stateLock } from '@proton/pass/store/actions';
import { AppStatus, SessionLockStatus, WorkerMessageType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import createStore from '@proton/shared/lib/helpers/store';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import store from '../store';
import { WorkerContext, withContext } from './context';

export const createWorkerContext = (config: ProtonConfig) => {
    const authStore = exposeAuthStore(createAuthStore(createStore()));

    const api = createApi({
        config,
        getAuth: () => {
            const AccessToken = authStore.getAccessToken();
            const RefreshToken = authStore.getRefreshToken();
            const RefreshTime = authStore.getRefreshTime();
            const UID = authStore.getUID();

            if (!(UID && AccessToken && RefreshToken)) return undefined;
            return { UID, AccessToken, RefreshToken, RefreshTime };
        },
    });

    exposeApi(api);

    const context = WorkerContext.set({
        status: AppStatus.IDLE,
        authStore,
        service: {
            auth: createAuthService({
                api,
                authStore,
                onInit: withContext(async (ctx, options) => {
                    /* if worker is logged out (unauthorized or locked) during an init call,
                     * this means the login or resumeSession calls failed - we can safely early
                     * return as the authentication store will have been configured */
                    if (clientUnauthorized(ctx.status)) return false;
                    if (clientAuthorized(ctx.status)) return true;
                    return context.service.auth.resumeSession(undefined, options);
                }),

                getPersistedSession: async () => {
                    const { ps } = await context.service.storage.local.get(['ps']);
                    if (!ps) return null;

                    const persistedSession = JSON.parse(ps);
                    return isValidPersistedSession(persistedSession) ? persistedSession : null;
                },

                getMemorySession: () => context.service.storage.session.get(SESSION_KEYS),
                onAuthorize: () => context.setStatus(AppStatus.AUTHORIZING),
                onAuthorized: () => {
                    context.setStatus(AppStatus.AUTHORIZED);
                    context.service.activation.boot();
                    context.service.autofill.updateTabsBadgeCount();
                    setSentryUID(authStore.getUID());
                },
                onUnauthorized: () => {
                    /* important to call setStatus before dispatching the
                     * the `stateDestroy` action : we might have active
                     * clients currently consuming the store data */
                    context.setStatus(AppStatus.UNAUTHORIZED);
                    store.dispatch(stateDestroy());

                    setSentryUID(undefined);
                    PassCrypto.clear();

                    context.service.formTracker.clear();
                    context.service.onboarding.reset();
                    context.service.autofill.clearTabsBadgeCount();
                    context.service.cacheProxy.clear?.().catch(noop);
                    context.service.storage.session.clear().catch(noop);
                    context.service.storage.local.clear().catch(noop);
                    browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);
                },
                onSessionInvalid: () => {
                    authStore.clear();
                    context.service.storage.local.unset(['ps']).catch(noop);
                    context.service.storage.session.clear().catch(noop);
                },

                onSessionUnlocked: () => {},

                onSessionEmpty: () => context.setStatus(AppStatus.UNAUTHORIZED),

                onSessionLocked: () => {
                    context.setStatus(AppStatus.LOCKED);
                    context.service.autofill.clearTabsBadgeCount();
                    PassCrypto.clear();

                    store.dispatch(stateLock());
                    context.service.auth.init().catch(noop);
                },

                onSessionLockCheck: (lock) => {
                    browser.alarms.clear(SESSION_LOCK_ALARM).catch(noop);

                    if (lock.status === SessionLockStatus.REGISTERED && lock.ttl) {
                        browser.alarms.create(SESSION_LOCK_ALARM, { when: (getEpoch() + lock.ttl) * 1_000 });
                    }

                    store.dispatch(sessionLockSync(lock));
                },

                onSessionPersist: (encryptedSession) => {
                    context.service.storage.local.set({ ps: encryptedSession }).catch(noop);
                    context.service.storage.session.set(authStore.getSession()).catch(noop);
                },
                onSessionResumeFailure: () => context.setStatus(AppStatus.RESUMING_FAILED),
                onNotification: (text) =>
                    store.dispatch(
                        notification({
                            text,
                            type: 'error',
                            key: 'authservice',
                            deduplicate: true,
                        })
                    ),
                onSessionRefresh: async (localID, { AccessToken, RefreshToken, RefreshTime }) => {
                    const persistedSession = await context.service.auth.config.getPersistedSession(localID);

                    if (persistedSession) {
                        /* update the persisted session tokens without re-encrypting the
                         * session blob as session refresh may happen before a full login
                         * with a partially hydrated authentication store. */
                        persistedSession.AccessToken = AccessToken;
                        persistedSession.RefreshToken = RefreshToken;
                        persistedSession.RefreshTime = RefreshTime;

                        context.service.storage.local.set({ ps: JSON.stringify(persistedSession) }).catch(noop);
                        context.service.storage.session.set({ AccessToken, RefreshToken, RefreshTime }).catch(noop);
                    }
                },
            }),
            activation: createActivationService(),
            alias: createAliasService(),
            autofill: createAutoFillService(),
            autosave: createAutoSaveService(),
            cacheProxy: createCacheProxyService(),
            export: createExportService(),
            formTracker: createFormTrackerService(),
            i18n: createI18nService(),
            injection: createInjectionService(),
            logger: createLoggerService(),
            onboarding: createOnboardingService(),
            otp: createOTPService(),
            settings: createSettingsService(),
            storage: createStorageService(),
            store: createStoreService(),
            telemetry: BUILD_TARGET !== 'firefox' ? createTelemetryService() : null,
        },

        async ensureReady() {
            const context = WorkerContext.get();
            await waitUntil(() => clientStatusResolved(context.getState().status), 50);

            return context;
        },

        getState: () => ({
            loggedIn: authStore.hasSession() && clientReady(context.status),
            status: context.status,
            UID: authStore.getUID(),
        }),

        setStatus(status: AppStatus) {
            logger.info(`[Worker::Context] Status update : ${context.status} -> ${status}`);
            context.status = status;

            void setPopupIcon({
                disabled: or(clientUnauthorized, clientErrored, clientStale)(status),
                locked: clientLocked(status),
            });

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.WORKER_STATUS,
                    payload: { state: context.getState() },
                })
            );
        },
    });

    context.service.i18n.init().catch(noop);
    context.service.onboarding.hydrate();
    context.service.cacheProxy.clean?.().catch(noop);

    if (ENV === 'development') {
        WorkerMessageBroker.registerMessage(WorkerMessageType.DEBUG, ({ payload }) => {
            switch (payload.debug) {
                case 'storage_full':
                    context.service.storage.getState().storageFull = true;
                    return true;
                case 'update_trigger':
                    context.service.activation.onUpdateAvailable({ version: getExtensionVersion() });
                    return true;
            }

            return false;
        });
    }

    return context;
};
