import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';
import config from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { isChromeExtensionRollback } from 'proton-pass-extension/lib/utils/chrome';
import { portTransferWriter } from 'proton-pass-extension/lib/utils/fs.utils';
import { WEB_REQUEST_PERMISSIONS, hasPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { EXTENSION_BUILD_VERSION, EXTENSION_MANIFEST_VERSION } from 'proton-pass-extension/lib/utils/version';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import createSagaMiddleware from 'redux-saga';

import { authStore } from '@proton/pass/lib/auth/store';
import { ACTIVE_POLLING_TIMEOUT, INACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { getRuleVersion } from '@proton/pass/lib/extension/rules/rules';
import { createMonitorReport } from '@proton/pass/lib/monitor/monitor.report';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { isActionWithSender } from '@proton/pass/store/actions/enhancers/endpoint';
import { sagaEvents } from '@proton/pass/store/events';
import { cacheGuard } from '@proton/pass/store/migrate';
import reducer from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { requestMiddlewareFactory } from '@proton/pass/store/request/middleware';
import { rootSagaFactory } from '@proton/pass/store/sagas';
import { EXTENSION_SAGAS } from '@proton/pass/store/sagas/extension';
import { selectFeatureFlag, selectLocale } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { first } from '@proton/pass/utils/array/first';
import { eq, not } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { broadcastMiddleware } from './broadcast.middleware';

export const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer,
    middleware: (middlewares) =>
        middlewares({ serializableCheck: false, immutableCheck: false, thunk: false }).concat(
            requestMiddlewareFactory({ acceptAsync: not(isActionWithSender) }),
            broadcastMiddleware,
            sagaMiddleware
        ),
    enhancers: (enhancers) =>
        enhancers().concat(
            ENV === 'development'
                ? [
                      devToolsEnhancer({
                          name: `store::sw::${uniqueId()}`,
                          port: REDUX_DEVTOOLS_PORT,
                          realtime: true,
                      }),
                  ]
                : []
        ),

    devTools: false,
});

export const options: RootSagaOptions = {
    endpoint: 'background',
    publish: sagaEvents.publish,

    getAuthStore: withContext((ctx) => ctx.authStore),
    getAuthService: withContext((ctx) => ctx.service.auth),
    getCache: withContext(async (ctx) => {
        const cache = await ctx.service.storage.local.getItems(['state', 'snapshot', 'salt', 'version']);

        if (isChromeExtensionRollback() && cache.version === EXTENSION_BUILD_VERSION) return {};
        return cacheGuard(cache, EXTENSION_MANIFEST_VERSION);
    }),

    getPort: (name) => first(WorkerMessageBroker.ports.query(eq(name))),
    getPortWriter: portTransferWriter,

    /* adapt event polling interval based on popup activity :
     * 30 seconds if popup is opened / 30 minutes if closed */
    getPollingInterval: () => {
        const popups = WorkerMessageBroker.ports.query(isPopupPort).length;
        return popups > 0 ? ACTIVE_POLLING_TIMEOUT : INACTIVE_POLLING_TIMEOUT;
    },

    getPollingDelay: (pollingInterval, lastCalledAt) => {
        if (!lastCalledAt) return 0;
        const delta = Math.max(getEpoch() - lastCalledAt, 0);
        return delta > pollingInterval ? 0 : pollingInterval - delta;
    },

    setCache: withContext((ctx, encryptedCache) =>
        ctx.service.storage.local.setItems({
            ...encryptedCache,
            version: EXTENSION_MANIFEST_VERSION,
        })
    ),

    getSettings: withContext((ctx) => ctx.service.settings.resolve()),
    getStorage: withContext((ctx) => ctx.service.storage.local),
    getTelemetry: withContext((ctx) => ctx.service.telemetry),
    getConfig: () => config,
    getAppState: withContext((ctx) => ctx.getState()),
    setAppStatus: withContext((ctx, status) => ctx.setStatus(status)),

    onBeforeHydrate: async (state) => {
        if (BUILD_TARGET !== 'safari') {
            /** Initialize basic auth autofill setting based on current permission state.
             * If not explicitly set by user, default to enabled when permission is already granted.
             * Done during hydration to keep browser API calls out of core application logic. */
            const basicAuth = state.settings.autofill.basicAuth;
            state.settings.autofill.basicAuth = basicAuth ?? (await hasPermissions(WEB_REQUEST_PERMISSIONS));
        }

        return state;
    },

    /* Sets the worker status according to the boot
     * sequence's result. On boot failure, clear. */
    onBoot: withContext(async (ctx, res) => {
        if (res.ok) {
            const state = store.getState();

            ctx.service.telemetry?.start().catch(noop);
            ctx.service.b2bEvents?.start().catch(noop);
            ctx.service.i18n.setLocale(selectLocale(state)).catch(noop);
            WorkerMessageBroker.buffer.flush();

            const lockMode = authStore.getLockMode();
            const lockTtl = authStore.getLockTTL();
            /* If the boot is initiated following a session unlock, execute the
             * `onSessionLockUpdate` effect after the sequence successfully completes.
             * This step ensures the proper setup of the `SESSION_LOCK_ALARM` based on
             * the current lock status and TTL */
            if (lockMode && lockTtl) {
                void ctx.service.auth.config.onLockUpdate?.(
                    { mode: lockMode, locked: false, ttl: lockTtl },
                    authStore.getLocalID(),
                    false
                );
            }
        } else if (res.clearCache) await ctx.service.storage.local.removeItems(['salt', 'state', 'snapshot']);
    }),

    onFeatureFlags: withContext((ctx, features) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                payload: features,
            })
        );

        const currentRuleVersion = ctx.service.autofill.getRules()?.version;
        const shouldRevalidate = currentRuleVersion !== getRuleVersion(features.PassExperimentalWebsiteRules ?? false);
        if (shouldRevalidate) ctx.service.store.dispatch(withRevalidate(resolveWebsiteRules.intent()));
    }),

    onItemsUpdated: withContext((ctx, options) => {
        /* Update the extension's badge count on every item state change */
        ctx.service.autofill.sync();

        if (ctx.service.b2bEvents && (options?.report ?? true)) {
            void createMonitorReport({
                state: store.getState(),
                monitor: ctx.service.monitor,
                dispatch: ctx.service.b2bEvents.push,
            });
        }
    }),

    onLocaleUpdated: withContext(async (ctx, locale) => ctx.service.i18n.setLocale(locale)),

    /* Either broadcast notification or buffer it
     * if no target ports are opened. Assume that if no
     * target is specified then notification is for popup */
    onNotification: (notification) => {
        const { endpoint } = notification;
        const reg = new RegExp(`^${endpoint ?? 'popup'}`);
        const ports = WorkerMessageBroker.ports.query((key) => reg.test(key));
        const canConsume = ports.length > 0;

        const message = backgroundMessage({
            type: WorkerMessageType.NOTIFICATION,
            payload: { notification },
        });

        logger.info(`[Notification::${notification.type}] ${notification.text}`);

        return canConsume || notification.type === 'success'
            ? WorkerMessageBroker.ports.broadcast(message)
            : WorkerMessageBroker.buffer.push(message);
    },

    onSettingsUpdated: withContext(async (ctx, update) => {
        /** Toggle autofill listener based on setting (runs on app boot and when user changes setting)
         * This ensures we only listen for basic auth opportunities when the feature is enabled */
        const basicAuthEnabled = selectFeatureFlag(PassFeature.PassBasicAuthAutofill)(ctx.service.store.getState());
        if (update.autofill.basicAuth && basicAuthEnabled) ctx.service.autofill.basicAuth.listen();
        else ctx.service.autofill.basicAuth.destroy();

        await ctx.service.settings.sync(update);
    }),
};

/** Redux Saga emits a `@@redux-saga/INIT` action when running the middleware.
 * This triggers browser API side-effects. To avoid service worker registration
 * errors, this should only be called after the worker has successfully activated.
 * (see `applications/pass-extension/src/app/worker/services/store.ts`) */
export const runSagas = () => sagaMiddleware.run(rootSagaFactory(EXTENSION_SAGAS).bind(null, options));

export default store;
