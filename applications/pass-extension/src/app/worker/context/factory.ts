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
import type { WorkerStatus } from '@proton/pass/types';
import { type Api, WorkerMessageType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { WorkerContext, withContext } from './context';

export const createWorkerContext = (options: { api: Api; status: WorkerStatus }) => {
    const auth = createAuthService({
        api: options.api,
        onAuthorized: withContext((ctx) => {
            ctx.service.activation.boot();
            ctx.service.autofill.updateTabsBadgeCount();
            setSentryUID(auth.store.getUID());
        }),
        onUnauthorized: withContext((ctx) => {
            ctx.service.formTracker.clear();
            ctx.service.onboarding.reset();
            ctx.service.autofill.clearTabsBadgeCount();
            ctx.service.cacheProxy.clear?.().catch(noop);
            setSentryUID(undefined);
            PassCrypto.clear();
        }),
        onLocked: withContext((ctx) => {
            ctx.service.autofill.clearTabsBadgeCount();
            PassCrypto.clear();
        }),
    });

    const context = WorkerContext.set({
        status: options.status,
        service: {
            auth,
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
            loggedIn: auth.store.hasSession() && workerReady(context.status),
            status: context.status,
            UID: auth.store.getUID(),
        }),

        setStatus(status: WorkerStatus) {
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

        async init({ sync, force }) {
            const shouldInit = Boolean((sync ?? !workerReady(context.status)) || force);
            const shouldBoot = shouldInit && (await auth.init());

            if (shouldBoot) context.service.activation.boot();

            return context;
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
