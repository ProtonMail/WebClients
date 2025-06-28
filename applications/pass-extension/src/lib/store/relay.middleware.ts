import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { type Middleware, isAction } from 'redux';

import { isSynchronousAction } from '@proton/pass/store/actions/enhancers/client';
import { isActionFrom, withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { ClientEndpoint, TabId } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type ProxyActionsMiddlewareOptions = {
    endpoint: ClientEndpoint;
    tabId: TabId;
};

/** Middleware that intercepts and relays Redux actions to the worker process.
 * This middleware intentionally captures all incoming actions and forwards them
 * to the worker for re-emission, ensuring consistent event ordering across
 * the worker, popup, and content scripts. The flow is as follows:
 *
 * 1. Skip relay for background worker actions to prevent circular messaging
 * 2. Process synchronous actions locally before relay
 * 3. Relay to the worker with correct sender metadata */
export const relayMiddleware = ({ endpoint, tabId }: ProxyActionsMiddlewareOptions): Middleware => {
    const messageFactory = resolveMessageFactory(endpoint);

    return () => (next) => (action: unknown) => {
        if (isAction(action)) {
            if (isActionFrom('background')(action)) return next(action);

            /* if action should be processed immediately on the client
             * reducers, forward it before broadcasting to the worker */
            if (isSynchronousAction(action)) next(action);

            /* hydrate the action with the current client's sender data */
            const message = messageFactory({
                type: WorkerMessageType.STORE_DISPATCH,
                payload: { action },
            });

            message.payload.action = withSender({ endpoint: message.sender, tabId })(message.payload.action);
            sendMessage(message).catch(noop);
        }
    };
};
