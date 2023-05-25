import type { AnyAction, Middleware } from 'redux';

import { backgroundMessage } from '@proton/pass/extension/message';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/with-callback';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

/**
 * Redux middleware for service-worker action flow :
 * - proxies every action through the extension's message channel
 * - forwards actions to saga middleware
 */
export const workerMiddleware: Middleware = () => (next) => (action: AnyAction) => {
    WorkerMessageBroker.ports.broadcast(
        backgroundMessage({
            type: WorkerMessageType.STORE_ACTION,
            payload: { action: sanitizeWithCallbackAction(action) },
        }),
        (name) => /^(popup|page)/.test(name)
    );

    next(action);
};
