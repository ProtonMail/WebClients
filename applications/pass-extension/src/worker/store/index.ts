import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import devToolsEnhancer from 'remote-redux-devtools';

import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/events/constants';
import { backgroundMessage } from '@proton/pass/extension/message';
import { browserLocalStorage } from '@proton/pass/extension/storage';
import type { WorkerRootSagaOptions } from '@proton/pass/store';
import reducer from '@proton/pass/store/reducers';
import { workerRootSaga } from '@proton/pass/store/sagas';
import {
    type RequiredNonNull,
    SessionLockStatus,
    ShareEventType,
    WorkerMessageType,
    WorkerStatus,
} from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import { logger } from '@proton/pass/utils/logger';
import { workerReady } from '@proton/pass/utils/worker';

import { isPopupPort } from '../../shared/extension/port';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import { workerMiddleware } from './worker.middleware';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer,
    middleware: [workerMiddleware, sagaMiddleware],
    enhancers:
        ENV === 'development'
            ? [
                  devToolsEnhancer({
                      name: 'background',
                      port: 8000,
                      realtime: true,
                      secure: true,
                  }),
              ]
            : [],
});

const options: RequiredNonNull<WorkerRootSagaOptions> = {
    getAuth: withContext((ctx) => ctx.service.auth.authStore),

    /* adapt event polling interval based on popup activity :
     * 30 seconds if popup is opened / 30 minutes if closed */
    getEventInterval: () =>
        // WorkerMessageBroker.ports.query(isPopupPort()).length > 0 ? ACTIVE_POLLING_TIMEOUT : INACTIVE_POLLING_TIMEOUT,
        // FIXME: this is a temporary fix to avoid service worker being killed
        ACTIVE_POLLING_TIMEOUT,

    /* Sets the worker status according to the
     * boot sequence's result. On boot failure,
     * clear */
    onBoot: withContext(async (ctx, result) => {
        if (result.ok) {
            ctx.setStatus(WorkerStatus.READY);
            WorkerMessageBroker.buffer.flush();
        } else {
            ctx.setStatus(WorkerStatus.ERROR);
            if (result.clearCache) {
                await browserLocalStorage.removeItems(['salt', 'state', 'snapshot']);
            }
        }
    }),

    /* only trigger cache flow if worker is ready */
    onCacheRequest: withContext((ctx) => workerReady(ctx.getState().status)),

    onSignout: withContext(({ service: { auth } }) => auth.logout()),

    onSessionLocked: withContext((ctx) => ctx.service.auth.lock()),

    onSessionUnlocked: withContext(async (ctx) => {
        ctx.service.auth.unlock();
        await ctx.init({ force: true });
    }),

    onSessionLockChange: withContext(({ service: { auth } }, registered) =>
        auth.setLockStatus(registered ? SessionLockStatus.REGISTERED : null)
    ),

    /* Update the extension's badge count on every
     * item state change */
    onItemsChange: withContext((ctx) => ctx.service.autofill.updateTabsBadgeCount()),

    onImportProgress: (progress, endpoint) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.IMPORT_PROGRESS,
                payload: { progress },
            }),
            (name) => (endpoint ? name.startsWith(endpoint) : false)
        );
    },

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

    /* Either broadcast notification or buffer it
     * if no target ports are opened. Assume that if no
     * target is specified then notification is for popup */
    onNotification: (notification) => {
        const { receiver } = notification;
        const reg = new RegExp(`^${receiver ?? 'popup'}`);
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

    telemetry: withContext<(event: TelemetryEvent) => void>((ctx, event) => {
        void ctx.service.telemetry?.pushEvent(event);
    }),
};

sagaMiddleware.run(workerRootSaga.bind(null, options));

export default store;
