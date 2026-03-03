import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { createActivationService } from 'proton-pass-extension/app/worker/services/activation';
import { createAliasService } from 'proton-pass-extension/app/worker/services/alias';
import { createApiProxyService } from 'proton-pass-extension/app/worker/services/api-proxy';
import { createAuthService } from 'proton-pass-extension/app/worker/services/auth/auth.service';
import { createAutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import { createAutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
import { createB2BEventsService } from 'proton-pass-extension/app/worker/services/b2b';
import { createClipboardService } from 'proton-pass-extension/app/worker/services/clipboard';
import { createConnectivityService } from 'proton-pass-extension/app/worker/services/connectivity';
import { createPassCoreProxyService } from 'proton-pass-extension/app/worker/services/core';
import { createFeatureFlagService } from 'proton-pass-extension/app/worker/services/feature-flags';
import { createFormTrackerService } from 'proton-pass-extension/app/worker/services/form.tracker';
import { createI18nService } from 'proton-pass-extension/app/worker/services/i18n';
import { createContentScriptService } from 'proton-pass-extension/app/worker/services/injection';
import { createInlineService } from 'proton-pass-extension/app/worker/services/inline';
import { createLoggerService } from 'proton-pass-extension/app/worker/services/logger';
import { createMonitorService } from 'proton-pass-extension/app/worker/services/monitor';
import { createNativeMessagingService } from 'proton-pass-extension/app/worker/services/native-messaging';
import { createOTPService } from 'proton-pass-extension/app/worker/services/otp';
import { createPasskeyService } from 'proton-pass-extension/app/worker/services/passkey';
import { createSentryService } from 'proton-pass-extension/app/worker/services/sentry';
import { createSettingsService } from 'proton-pass-extension/app/worker/services/settings';
import { createSpotlightService } from 'proton-pass-extension/app/worker/services/spotlight';
import { createStorageService } from 'proton-pass-extension/app/worker/services/storage';
import { createStoreService } from 'proton-pass-extension/app/worker/services/store';
import { createTelemetryService } from 'proton-pass-extension/app/worker/services/telemetry';
import { createVaultsService } from 'proton-pass-extension/app/worker/services/vaults';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { setPopupIcon } from 'proton-pass-extension/lib/utils/popup';
import { EXTENSION_BUILD_VERSION } from 'proton-pass-extension/lib/utils/version';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { desktopLockAdapterFactory } from '@proton/pass/lib/auth/lock/desktop/adapter';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientStatusResolved } from '@proton/pass/lib/client';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { QA_SERVICE } from '@proton/pass/lib/qa/service';
import { registerStoreEffect } from '@proton/pass/store/connect/effect';
import { selectLockSetupRequired } from '@proton/pass/store/selectors/settings';
import type { AppState } from '@proton/pass/types/worker/state';
import { AppStatus } from '@proton/pass/types/worker/state';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { createMemoryStore } from '@proton/pass/utils/store';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { WorkerContext } from './inject';

export const createWorkerContext = (config: ProtonConfig) => {
    const api = exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));
    const authStore = exposeAuthStore(createAuthStore(createMemoryStore()));
    const storage = createStorageService();
    const core = createPassCoreProxyService();
    const auth = createAuthService(api, authStore);
    const store = createStoreService();
    const nativeMessaging = createNativeMessagingService(authStore);

    if (ENV === 'development') QA_SERVICE?.init(storage.local);
    auth.registerLockAdapter(LockMode.SESSION, sessionLockAdapterFactory(auth));
    auth.registerLockAdapter(LockMode.DESKTOP, desktopLockAdapterFactory(auth, nativeMessaging));
    auth.registerLockAdapter(LockMode.PASSWORD, passwordLockAdapterFactory(auth));

    exposePassCrypto(createPassCrypto(core, store));

    const onStateUpdate = (state: AppState) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.WORKER_STATE_CHANGE,
                payload: { state },
            })
        );
    };

    const context = WorkerContext.set({
        status: AppStatus.IDLE,
        booted: false,
        authStore,
        service: {
            activation: createActivationService(),
            alias: createAliasService(),
            apiProxy: createApiProxyService(),
            auth,
            autofill: createAutoFillService(),
            autosave: createAutoSaveService(),
            b2bEvents: createB2BEventsService(storage.local, store),
            clipboard: createClipboardService(),
            core,
            connectivity: createConnectivityService(),
            featureFlags: createFeatureFlagService(),
            formTracker: createFormTrackerService(),
            inline: createInlineService(),
            i18n: createI18nService(),
            injection: createContentScriptService(),
            logger: createLoggerService(storage.local),
            monitor: createMonitorService(core, store),
            otp: createOTPService(),
            passkey: createPasskeyService(),
            sentry: createSentryService(),
            settings: createSettingsService(),
            spotlight: createSpotlightService(storage.local, store),
            storage,
            store,
            telemetry: BUILD_TARGET !== 'firefox' ? createTelemetryService(storage.local) : null,
            vaults: createVaultsService(),
        },

        async ensureReady() {
            await waitUntil(() => clientStatusResolved(context.getState().status), 50);
            return context;
        },

        getState: () => {
            /** Note: A user is not considered fully authorized if lock setup is required.
             * This allows blocking other extension components (e.g., injected dropdown)
             * when the user is in this state. */
            const lockSetup = selectLockSetupRequired(store.getState());

            return {
                authorized: authStore.hasSession() && clientBooted(context.status) && !lockSetup,
                booted: context.booted,
                localID: authStore.getLocalID(),
                lockSetup,
                status: context.status,
                UID: authStore.getUID(),
            };
        },

        setStatus(status: AppStatus) {
            if (context.status !== status) {
                logger.info(`[Worker::Context] Status update : ${context.status} -> ${status}`);
                context.status = status;
                setPopupIcon(status);
                onStateUpdate(context.getState());
            }
        },

        setBooted(booted) {
            if (context.booted !== booted) {
                context.booted = booted;
                onStateUpdate(context.getState());
            }
        },
    });

    context.service.spotlight.init().catch(noop);
    context.service.apiProxy.clean?.().catch(noop);
    context.service.i18n.init().catch(noop);
    context.service.auth.listen();

    /* Watch for `lockSetup` state changes. Notify all extension
     * components on update in order for clients' states to sync. */
    registerStoreEffect(store, selectLockSetupRequired, (lockSetup) => {
        if (lockSetup !== context.getState().lockSetup) {
            onStateUpdate(context.getState());
        }
    });

    if (ENV === 'development') {
        WorkerMessageBroker.registerMessage(WorkerMessageType.DEBUG, ({ payload }) => {
            switch (payload.debug) {
                case 'storage_full':
                    context.service.storage.getState().storageFull = true;
                    return true;
                case 'update_trigger':
                    void context.service.activation.onUpdateAvailable({ version: EXTENSION_BUILD_VERSION });
                    return true;
            }

            return false;
        });
    }

    return context;
};
