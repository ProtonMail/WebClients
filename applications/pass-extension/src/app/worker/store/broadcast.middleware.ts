import { type Middleware, isAction } from 'redux';

import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/enhancers/callback';
import { withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { State } from '@proton/pass/store/types';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

/** Middleware that broadcasts Redux actions from the worker to all clients.
 * This middleware handles broadcasting store updates to extension clients
 * to maintain consistent state. The flow is as follows:
 * 1. Sanitize action and mark as worker-originated
 * 2. Broadcast to popup/page clients via ports */
export const broadcastMiddleware: Middleware<{}, State> = () => (next) => (action: unknown) => {
    if (isAction(action)) {
        const sanitizedAction = withSender({ endpoint: 'background' })(sanitizeWithCallbackAction(action));
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.STORE_DISPATCH,
                payload: { action: sanitizedAction },
            }),
            (name) => /^(popup|page)/.test(name)
        );

        next(action);
    }
};
