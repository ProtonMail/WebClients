import { type Middleware, isAction } from 'redux';

import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/enhancers/callback';
import type { State } from '@proton/pass/store/types';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

/** Redux middleware for service-worker action flow :
 * - proxies every action through the extension's message channel
 * - forwards actions to saga middleware */
export const broadcastMiddleware: Middleware<{}, State> = () => (next) => (action: unknown) => {
    if (isAction(action)) {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.STORE_DISPATCH,
                payload: { action: sanitizeWithCallbackAction(action) },
            }),
            (name) => /^(popup|page)/.test(name)
        );

        next(action);
    }
};
