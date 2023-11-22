import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { getExtensionVersion } from 'proton-pass-extension/lib/utils/version';
import createSagaMiddleware from 'redux-saga';

import { ACTIVE_POLLING_TIMEOUT, INACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import { startEventPolling } from '@proton/pass/store/actions';
import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import reducer from '@proton/pass/store/reducers';
import { workerRootSaga } from '@proton/pass/store/sagas';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { AppStatus, ShareEventType, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { workerMiddleware } from './worker.middleware';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer,
    middleware: [requestMiddleware, workerMiddleware, sagaMiddleware],
    enhancers:
        ENV === 'development'
            ? [
                  devToolsEnhancer({
                      name: 'background',
                      port: REDUX_DEVTOOLS_PORT,
                      realtime: true,
                  }),
              ]
            : [],
});

const options: WorkerRootSagaOptions = {
    endpoint: 'background',
    getAuthStore: withContext((ctx) => ctx.authStore),
    getAuthService: withContext((ctx) => ctx.service.auth),
    getCache: withContext(async (ctx) => {
        /* cache is considered valid if versions match */
        const cache = await ctx.service.storage.local.get(['state', 'snapshot', 'salt', 'version']);
        return cache.version === getExtensionVersion() ? cache : {};
    }),

    /* adapt event polling interval based on popup activity :
     * 30 seconds if popup is opened / 30 minutes if closed */
    getEventInterval: () =>
        WorkerMessageBroker.ports.query(isPopupPort()).length > 0 ? ACTIVE_POLLING_TIMEOUT : INACTIVE_POLLING_TIMEOUT,

    setCache: withContext((ctx, encryptedCache) =>
        ctx.service.storage.local.set({
            ...encryptedCache,
            version: getExtensionVersion(),
        })
    ),

    getLocalSettings: withContext((ctx) => ctx.service.settings.resolve()),
    getTelemetry: withContext((ctx) => ctx.service.telemetry),
    getAppState: withContext((ctx) => ctx.getState()),

    /* Sets the worker status according to the
     * boot sequence's result. On boot failure,
     * clear */
    onBoot: withContext(async (ctx, res) => {
        if (res.ok) {
            store.dispatch(startEventPolling());
            void ctx.service.telemetry?.start();
            ctx.setStatus(AppStatus.READY);
            WorkerMessageBroker.buffer.flush();
        } else {
            ctx.service.telemetry?.stop();
            ctx.setStatus(AppStatus.ERROR);
            if (res.clearCache) await ctx.service.storage.local.unset(['salt', 'state', 'snapshot']);
        }
    }),

    onFeatureFlagsUpdate: (features) =>
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.FEATURE_FLAGS_UPDATE,
                payload: features,
            })
        ),

    /* Update the extension's badge count on every item state change */
    onItemsChange: withContext((ctx) => ctx.service.autofill.updateTabsBadgeCount()),

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

    onSettingUpdate: withContext((ctx, update) => ctx.service.settings.sync(update)),

    onShareEventDisabled: (shareId) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SHARE_SERVER_EVENT,
                payload: {
                    type: ShareEventType.SHARE_DISABLED,
                    shareId,
                },
            }),
            isPopupPort()
        );
    },

    onShareEventItemsDeleted: (shareId, itemIds) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.SHARE_SERVER_EVENT,
                payload: {
                    type: ShareEventType.ITEMS_DELETED,
                    shareId,
                    itemIds,
                },
            }),
            isPopupPort()
        );
    },
};

sagaMiddleware.run(workerRootSaga.bind(null, options));

export default store;
