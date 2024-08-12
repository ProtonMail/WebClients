import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { createActivationService } from 'proton-pass-extension/app/worker/services/activation';
import { createAliasService } from 'proton-pass-extension/app/worker/services/alias';
import { createApiProxyService } from 'proton-pass-extension/app/worker/services/api-proxy';
import { createAuthService } from 'proton-pass-extension/app/worker/services/auth';
import { createAutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import { createAutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
import { createB2BEventsService } from 'proton-pass-extension/app/worker/services/b2b';
import { createPassCoreProxyService } from 'proton-pass-extension/app/worker/services/core';
import { createExportService } from 'proton-pass-extension/app/worker/services/export';
import { createFormTrackerService } from 'proton-pass-extension/app/worker/services/form.tracker';
import { createI18nService } from 'proton-pass-extension/app/worker/services/i18n';
import { createImportService } from 'proton-pass-extension/app/worker/services/import';
import { createInjectionService } from 'proton-pass-extension/app/worker/services/injection';
import { createLoggerService } from 'proton-pass-extension/app/worker/services/logger';
import { createMonitorService } from 'proton-pass-extension/app/worker/services/monitor';
import { createOnboardingService } from 'proton-pass-extension/app/worker/services/onboarding';
import { createOTPService } from 'proton-pass-extension/app/worker/services/otp';
import { createPasskeyService } from 'proton-pass-extension/app/worker/services/passkey';
import { createSettingsService } from 'proton-pass-extension/app/worker/services/settings';
import { createStorageService } from 'proton-pass-extension/app/worker/services/storage';
import { createStoreService } from 'proton-pass-extension/app/worker/services/store';
import { createTelemetryService } from 'proton-pass-extension/app/worker/services/telemetry';
import { setPopupIcon } from 'proton-pass-extension/lib/utils/popup-icon';
import { getExtensionVersion } from 'proton-pass-extension/lib/utils/version';

import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientDisabled, clientLocked, clientReady, clientStatusResolved } from '@proton/pass/lib/client';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { registerStoreEffect } from '@proton/pass/store/connect/effect';
import { selectLockSetupRequired } from '@proton/pass/store/selectors';
import { type AppState, AppStatus, WorkerMessageType } from '@proton/pass/types';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import createStore from '@proton/shared/lib/helpers/store';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import store from '../store';
import { WorkerContext } from './context';

export const createWorkerContext = (config: ProtonConfig) => {
    const api = exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));
    const authStore = exposeAuthStore(createAuthStore(createStore()));
    const storage = createStorageService();
    const core = createPassCoreProxyService();
    const auth = createAuthService(api, authStore);

    auth.registerLockAdapter(LockMode.SESSION, sessionLockAdapterFactory(auth));
    exposePassCrypto(createPassCrypto());

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
        authStore,
        service: {
            activation: createActivationService(),
            alias: createAliasService(),
            apiProxy: createApiProxyService(),
            auth,
            autofill: createAutoFillService(),
            autosave: createAutoSaveService(),
            b2bEvents: createB2BEventsService(storage.local),
            core,
            export: createExportService(),
            formTracker: createFormTrackerService(),
            i18n: createI18nService(),
            import: createImportService(),
            injection: createInjectionService(),
            logger: createLoggerService(storage.local),
            monitor: createMonitorService(core, store),
            onboarding: createOnboardingService(storage.local),
            otp: createOTPService(),
            passkey: createPasskeyService(),
            settings: createSettingsService(),
            storage,
            store: createStoreService(),
            telemetry: BUILD_TARGET !== 'firefox' ? createTelemetryService(storage.local) : null,
        },

        async ensureReady() {
            await waitUntil(() => clientStatusResolved(context.getState().status), 50);
            return context;
        },

        getState: () => {
            /** Note: A user is not considered fully logged in if lock setup is required.
             * This allows blocking other extension components (e.g., injected dropdown)
             * when the user is in this state. */
            const lockSetup = selectLockSetupRequired(store.getState());

            return {
                booted: clientBooted(context.status),
                localID: authStore.getLocalID(),
                loggedIn: authStore.hasSession() && clientReady(context.status) && !lockSetup,
                status: context.status,
                UID: authStore.getUID(),
            };
        },

        setStatus(status: AppStatus) {
            logger.info(`[Worker::Context] Status update : ${context.status} -> ${status}`);
            context.status = status;
            void setPopupIcon({ disabled: clientDisabled(status), locked: clientLocked(status) });
            onStateUpdate(context.getState());
        },
    });

    context.service.onboarding.init().catch(noop);
    context.service.apiProxy.clean?.().catch(noop);
    context.service.i18n.init().catch(noop);

    /* Watch for `lockSetup` state changes. Notify all extension
     * components on update in order for clients' states to sync. */
    registerStoreEffect(store, selectLockSetupRequired, (_) => onStateUpdate(context.getState()));

    if (ENV === 'development') {
        WorkerMessageBroker.registerMessage(WorkerMessageType.DEBUG, ({ payload }) => {
            switch (payload.debug) {
                case 'storage_full':
                    context.service.storage.getState().storageFull = true;
                    return true;
                case 'update_trigger':
                    void context.service.activation.onUpdateAvailable({ version: getExtensionVersion() });
                    return true;
            }

            return false;
        });
    }

    return context;
};
