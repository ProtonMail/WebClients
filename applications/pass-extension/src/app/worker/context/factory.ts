import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { createActivationService } from 'proton-pass-extension/app/worker/services/activation';
import { createAliasService } from 'proton-pass-extension/app/worker/services/alias';
import { createAuthService } from 'proton-pass-extension/app/worker/services/auth';
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
import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import {
    workerErrored,
    workerLocked,
    workerLoggedOut,
    workerReady,
    workerStale,
    workerStatusResolved,
} from '@proton/pass/lib/worker';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { WorkerContext } from './context';

export const createWorkerContext = (config: ProtonConfig) => {
    const context = WorkerContext.set({
        status: AppStatus.IDLE,
        service: {
            auth: createAuthService({
                onAuthorized: () => {
                    context.service.activation.boot();
                    context.service.autofill.updateTabsBadgeCount();
                    setSentryUID(context.service.auth.store.getUID());
                },
                onUnauthorized: () => {
                    context.service.formTracker.clear();
                    context.service.onboarding.reset();
                    context.service.autofill.clearTabsBadgeCount();
                    context.service.cacheProxy.clear?.().catch(noop);
                    setSentryUID(undefined);
                    PassCrypto.clear();
                },
                onLocked: () => {
                    context.service.autofill.clearTabsBadgeCount();
                    PassCrypto.clear();
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
            await waitUntil(() => workerStatusResolved(context.getState().status), 50);

            return context;
        },

        getState: () => ({
            loggedIn: context.service.auth.store.hasSession() && workerReady(context.status),
            status: context.status,
            UID: context.service.auth.store.getUID(),
        }),

        setStatus(status: AppStatus) {
            logger.info(`[Worker::Context] Status update : ${context.status} -> ${status}`);
            context.status = status;

            void setPopupIcon({
                disabled: or(workerLoggedOut, workerErrored, workerStale)(status),
                locked: workerLocked(status),
            });

            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.WORKER_STATUS,
                    payload: { state: context.getState() },
                })
            );
        },
    });

    const api = createApi({
        config,
        getAuth: () => {
            const AccessToken = context.service.auth.store.getAccessToken();
            const RefreshToken = context.service.auth.store.getRefreshToken();
            const RefreshTime = context.service.auth.store.getRefreshTime();
            const UID = context.service.auth.store.getUID();

            if (!(UID && AccessToken && RefreshToken)) return undefined;
            return { UID, AccessToken, RefreshToken, RefreshTime };
        },
        onRefresh: (data, refreshTime) => {
            context.service.auth.store.setAccessToken(data.AccessToken);
            context.service.auth.store.setRefreshToken(data.RefreshToken);
            context.service.auth.store.setUID(data.UID);
            context.service.auth.store.setRefreshTime(refreshTime);

            /* Check if the worker is ready before persisting the session
             * This prevents unnecessary persistence when the refresh was
             * triggered by a session unlock request*/
            /* TODO: no need to persist here -> only write to storage */
            if (workerReady(context.status)) void context.service.auth.persistSession();
        },
    });

    exposeApi(api);

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
