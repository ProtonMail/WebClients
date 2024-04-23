import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { createActivationService } from 'proton-pass-extension/app/worker/services/activation';
import { createAliasService } from 'proton-pass-extension/app/worker/services/alias';
import { createApiProxyService } from 'proton-pass-extension/app/worker/services/api-proxy';
import { createAuthService } from 'proton-pass-extension/app/worker/services/auth';
import { createAutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import { createAutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
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
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import {
    clientErrored,
    clientLocked,
    clientReady,
    clientStale,
    clientStatusResolved,
    clientUnauthorized,
} from '@proton/pass/lib/client';
import { createPassCoreSyncService } from '@proton/pass/lib/core/sync.service';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
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
    const core = createPassCoreSyncService();

    exposePassCrypto(createPassCrypto());

    const context = WorkerContext.set({
        status: AppStatus.IDLE,
        authStore,
        service: {
            activation: createActivationService(),
            alias: createAliasService(),
            apiProxy: createApiProxyService(),
            auth: createAuthService(api, authStore),
            autofill: createAutoFillService(),
            autosave: createAutoSaveService(),
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

        getState: () => ({
            localID: authStore.getLocalID(),
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

    context.service.onboarding.init().catch(noop);
    context.service.apiProxy.clean?.().catch(noop);
    context.service.i18n.init().catch(noop);

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
