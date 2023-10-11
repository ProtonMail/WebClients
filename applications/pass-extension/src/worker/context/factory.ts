import { PassCrypto } from '@proton/pass/lib/crypto';
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
import { or, waitUntil } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import { setPopupIcon } from '../../shared/extension';
import { getExtensionVersion } from '../../shared/extension/version';
import WorkerMessageBroker from '../channel';
import { createActivationService } from '../services/activation';
import { createAliasService } from '../services/alias';
import { createAuthService } from '../services/auth';
import { createAutoFillService } from '../services/autofill';
import { createAutoSaveService } from '../services/autosave';
import { createCacheProxyService } from '../services/cache-proxy';
import { createExportService } from '../services/export';
import { createFormTrackerService } from '../services/form.tracker';
import { createI18nService } from '../services/i18n';
import { createInjectionService } from '../services/injection';
import { createLoggerService } from '../services/logger';
import { createOnboardingService } from '../services/onboarding';
import { createOTPService } from '../services/otp';
import { createSettingsService } from '../services/settings';
import { createStorageService } from '../services/storage';
import { createStoreService } from '../services/store';
import { createTelemetryService } from '../services/telemetry';
import { WorkerContext, withContext } from './context';

export const createWorkerContext = (options: { api: Api; status: WorkerStatus }) => {
    const auth = createAuthService({
        api: options.api,
        onAuthorized: withContext((ctx) => {
            ctx.service.activation.boot();
            ctx.service.autofill.updateTabsBadgeCount();
            ctx.service.telemetry?.start().catch(noop);
            setSentryUID(auth.store.getUID());
        }),
        onUnauthorized: withContext((ctx) => {
            ctx.service.formTracker.clear();
            ctx.service.onboarding.reset();
            ctx.service.telemetry?.reset();
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
