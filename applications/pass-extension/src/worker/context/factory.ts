import { backgroundMessage } from '@proton/pass/extension/message';
import type { WorkerStatus } from '@proton/pass/types';
import { type Api, WorkerMessageType } from '@proton/pass/types';
import { or, waitUntil } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';
import {
    workerErrored,
    workerLocked,
    workerLoggedOut,
    workerReady,
    workerStale,
    workerStatusResolved,
} from '@proton/pass/utils/worker';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';

import { setPopupIcon } from '../../shared/extension';
import WorkerMessageBroker from '../channel';
import { createActivationService } from '../services/activation';
import { createAliasService } from '../services/alias';
import { createAuthService } from '../services/auth';
import { createAutoFillService } from '../services/autofill';
import { createAutoSaveService } from '../services/autosave';
import { createCacheProxyService } from '../services/cache-proxy';
import { createExportService } from '../services/export';
import { createFormTrackerService } from '../services/form.tracker';
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
            void ctx.service.telemetry?.start();
            setSentryUID(auth.store.getUID());
        }),
        onUnauthorized: withContext((ctx) => {
            ctx.service.formTracker.clear();
            ctx.service.onboarding.reset();
            ctx.service.telemetry?.reset();
            ctx.service.autofill.clearTabsBadgeCount();
            setSentryUID(undefined);
        }),
        onLocked: withContext((ctx) => {
            ctx.service.autofill.clearTabsBadgeCount();
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

    context.service.onboarding.hydrate();

    return context;
};
