import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { getExtensionVersion } from 'proton-pass-extension/lib/utils/version';
import createSagaMiddleware from 'redux-saga';

import { authStore } from '@proton/pass/lib/auth/store';
import { ACTIVE_POLLING_TIMEOUT, INACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { draftsGarbageCollect, startEventPolling } from '@proton/pass/store/actions';
import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import reducer from '@proton/pass/store/reducers';
import { workerRootSaga } from '@proton/pass/store/sagas';
import { selectLocale } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { broadcastMiddleware } from './broadcast.middleware';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer,
    middleware: (middlewares) =>
        middlewares({ serializableCheck: false, thunk: false }).concat(
            requestMiddleware,
            broadcastMiddleware,
            sagaMiddleware
        ),
    enhancers: (enhancers) =>
        enhancers().concat(
            ENV === 'development'
                ? [
                      devToolsEnhancer({
                          name: 'store::sw',
                          port: REDUX_DEVTOOLS_PORT,
                          realtime: true,
                      }),
                  ]
                : []
        ),

    devTools: false,
});

const options: RootSagaOptions = {
    endpoint: 'background',
    getAuthStore: withContext((ctx) => ctx.authStore),
    getAuthService: withContext((ctx) => ctx.service.auth),
    getCache: withContext(async (ctx) => {
        /* cache is considered valid if versions match */
        const cache = await ctx.service.storage.local.getItems(['state', 'snapshot', 'salt', 'version']);
        return cache.version === getExtensionVersion() ? cache : {};
    }),

    /* adapt event polling interval based on popup activity :
     * 30 seconds if popup is opened / 30 minutes if closed */
    getEventInterval: () =>
        WorkerMessageBroker.ports.query(isPopupPort()).length > 0 ? ACTIVE_POLLING_TIMEOUT : INACTIVE_POLLING_TIMEOUT,

    setCache: withContext((ctx, encryptedCache) =>
        ctx.service.storage.local.setItems({
            ...encryptedCache,
            version: getExtensionVersion(),
        })
    ),

    getSettings: withContext((ctx) => ctx.service.settings.resolve()),
    getTelemetry: withContext((ctx) => ctx.service.telemetry),
    getAppState: withContext((ctx) => ctx.getState()),

    /* Sets the worker status according to the
     * boot sequence's result. On boot failure,
     * clear */
    onBoot: withContext(async (ctx, res) => {
        if (res.ok) {
            ctx.setStatus(AppStatus.READY);
            ctx.service.telemetry?.start().catch(noop);
            ctx.service.i18n.setLocale(selectLocale(store.getState())).catch(noop);

            store.dispatch(startEventPolling());
            store.dispatch(draftsGarbageCollect());
            WorkerMessageBroker.buffer.flush();

            const lockStatus = authStore.getLockStatus();
            const lockTtl = authStore.getLockTTL();
            /* If the boot is initiated following a session unlock, execute the
             * `onSessionLockUpdate` effect after the sequence successfully completes.
             * This step ensures the proper setup of the `SESSION_LOCK_ALARM` based on
             * the current lock status and TTL */
            if (lockStatus && lockTtl) {
                void ctx.service.auth.config.onSessionLockUpdate?.(
                    {
                        status: lockStatus,
                        ttl: lockTtl,
                    },
                    false
                );
            }
        } else {
            ctx.setStatus(AppStatus.ERROR);
            if (res.clearCache) await ctx.service.storage.local.removeItems(['salt', 'state', 'snapshot']);
            ctx.service.telemetry?.stop();
        }
    }),

    onFeatureFlagsUpdated: (features) =>
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                payload: features,
            })
        ),

    /* Update the extension's badge count on every item state change */
    onItemsUpdated: withContext((ctx) => ctx.service.autofill.updateTabsBadgeCount()),

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

        logger.info(`[Notification::${notification.type}] ${notification.text} - broadcasting`);

        return canConsume || notification.type === 'success'
            ? WorkerMessageBroker.ports.broadcast(message)
            : WorkerMessageBroker.buffer.push(message);
    },

    onSettingsUpdated: withContext((ctx, update) => ctx.service.settings.sync(update)),
};

sagaMiddleware.run(workerRootSaga.bind(null, options));

export default store;
