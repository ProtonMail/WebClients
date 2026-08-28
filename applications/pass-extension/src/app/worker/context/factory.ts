import { API_CONCURRENCY_TRESHOLD } from '@proton/pass/constants';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { desktopLockAdapterFactory } from '@proton/pass/lib/auth/lock/desktop/adapter';
import { passwordLockAdapterFactory } from '@proton/pass/lib/auth/lock/password/adapter';
import { sessionLockAdapterFactory } from '@proton/pass/lib/auth/lock/session/adapter';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { clientBooted, clientStatusResolved } from '@proton/pass/lib/client';
import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { createPassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { QA_SERVICE } from '@proton/pass/lib/qa/service';
import { settingsEditIntent } from '@proton/pass/store/actions';
import { resolveModelArtifact } from '@proton/pass/store/actions/creators/model-artifact';
import { registerStoreEffect } from '@proton/pass/store/connect/effect';
import { selectAssignedModelId } from '@proton/pass/store/selectors/assigned-model-id';
import { selectLockSetupRequired } from '@proton/pass/store/selectors/settings';
import { selectAutofillModelExperimentGroup } from '@proton/pass/store/selectors/user';
import { AppStatus } from '@proton/pass/types/worker/state';
import { coalesce } from '@proton/pass/utils/fp/control';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { createMemoryStore } from '@proton/pass/utils/store';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { backgroundMessage } from '../../../lib/message/send-message';
import { setPopupIcon } from '../../../lib/utils/popup';
import { EXTENSION_BUILD_VERSION } from '../../../lib/utils/version';
import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { createActivationService } from '../services/activation';
import { createAliasService } from '../services/alias';
import { createApiProxyService } from '../services/api-proxy';
import { createAuthService } from '../services/auth/auth.service';
import { createAutoFillService } from '../services/autofill';
import { createAutoSaveService } from '../services/autosave';
import { createB2BEventsService } from '../services/b2b';
import { createClipboardService } from '../services/clipboard';
import { createConnectivityService } from '../services/connectivity';
import { createPassCoreProxyService } from '../services/core';
import { createFeatureFlagService } from '../services/feature-flags';
import { createFormTrackerService } from '../services/form.tracker';
import { createI18nService } from '../services/i18n';
import { createContentScriptService } from '../services/injection';
import { createInlineService } from '../services/inline';
import { createLoggerService } from '../services/logger';
import { createMonitorService } from '../services/monitor';
import { createNativeMessagingService } from '../services/native-messaging';
import { createOTPService } from '../services/otp';
import { createPasskeyService } from '../services/passkey';
import { createSentryService } from '../services/sentry';
import { createSettingsService } from '../services/settings';
import { createSpotlightService } from '../services/spotlight';
import { createStorageService } from '../services/storage';
import { createStoreService } from '../services/store';
import { createTelemetryService } from '../services/telemetry';
import { createVaultsService } from '../services/vaults';
import { WorkerContext, withContext } from './inject';

const OFFLINE_SESSION_KEYS: (keyof AuthSession)[] = [
    'offlineKD',
    'offlineConfig',
    'offlineVerifier',
    'encryptedOfflineKD',
];

export const createWorkerContext = (config: ProtonConfig) => {
    const api = exposeApi(createApi({ config, threshold: API_CONCURRENCY_TRESHOLD }));
    const authStore = exposeAuthStore(createAuthStore(createMemoryStore()));
    const storage = createStorageService();
    const core = createPassCoreProxyService();
    const auth = createAuthService(api, authStore);
    const store = createStoreService();
    const nativeMessaging = createNativeMessagingService(authStore);

    if (ENV === 'development') QA_SERVICE?.init(storage.local);
    auth.registerLockAdapter(sessionLockAdapterFactory(auth));
    auth.registerLockAdapter(desktopLockAdapterFactory(auth, nativeMessaging));
    auth.registerLockAdapter(passwordLockAdapterFactory(auth));

    exposePassCrypto(createPassCrypto(core, store));

    const onStateUpdate = coalesce(
        withContext((ctx) => {
            WorkerMessageBroker.ports.broadcast(
                backgroundMessage({
                    type: WorkerMessageType.WORKER_STATE_CHANGE,
                    payload: { state: ctx.getState() },
                })
            );
        })
    );

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
            nativeMessaging,
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
                onStateUpdate();
            }
        },

        setBooted(booted) {
            if (context.booted !== booted) {
                context.booted = booted;
                onStateUpdate();
            }
        },
    });

    context.service.spotlight.init().catch(noop);
    context.service.apiProxy.clean?.().catch(noop);
    context.service.i18n.init().catch(noop);
    context.service.auth.listen();
    context.service.passkey.init().catch(noop);

    /* Watch for `lockSetup` state changes. Notify all extension
     * components on update in order for clients' states to sync. */
    registerStoreEffect(store, selectLockSetupRequired, () => onStateUpdate());

    /* Re-resolve the assigned model ID when the experiment group changes */
    registerStoreEffect(store, selectAutofillModelExperimentGroup, () =>
        context.service.autofill.refreshAssignedModelId()
    );

    /* Fetch the model artifact whenever the assigned model ID changes */
    registerStoreEffect(store, selectAssignedModelId, (modelId) => {
        if (modelId) store.dispatch(resolveModelArtifact.intent(modelId));
    });

    /** QA helper: strips the session's offline components so offline mode can be
     * tested as a user who never got them, without creating a fresh session.
     * Refused when a lock depending on them is active: it would leave the session
     * impossible to unlock. */
    const clearOfflineComponents = async (): Promise<boolean> => {
        if ([LockMode.PASSWORD, LockMode.BIOMETRICS].includes(authStore.getLockMode())) {
            logger.warn('[QA] Cannot clear offline components while a password or biometrics lock is set');
            return false;
        }

        authStore.setOfflineKD(undefined);
        authStore.setOfflineConfig(undefined);
        authStore.setOfflineVerifier(undefined);
        authStore.setEncryptedOfflineKD(undefined);

        await context.service.auth.persistSession({ regenerateClientKey: true });
        await context.service.storage.session.removeItems(OFFLINE_SESSION_KEYS);

        store.dispatch(
            settingsEditIntent('offline', { offlineEnabled: false, offlinePrompt: { count: 0, dismissedAt: 0 } }, true)
        );

        return true;
    };

    if (ENV === 'development') {
        WorkerMessageBroker.registerMessage(WorkerMessageType.DEBUG, ({ payload }) => {
            switch (payload.debug) {
                case 'storage_full':
                    context.service.storage.getState().storageFull = true;
                    return true;
                case 'update_trigger':
                    void context.service.activation.onUpdateAvailable({ version: EXTENSION_BUILD_VERSION });
                    return true;
                case 'clear_offline_components':
                    return clearOfflineComponents();
            }

            return false;
        });
    }

    return context;
};
