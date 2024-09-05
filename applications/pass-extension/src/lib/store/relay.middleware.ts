import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { type Middleware, isAction } from 'redux';

import { resolveMessageFactory, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { isSynchronousAction } from '@proton/pass/store/actions/enhancers/client';
import { acceptActionWithReceiver, withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { ClientEndpoint, TabId, WorkerMessageWithSender } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type ProxyActionsMiddlewareOptions = {
    endpoint: ClientEndpoint;
    tabId: TabId;
};

/** This middleware eats all actions coming through on purpose and sends them
 * to the worker for re-emission. This is to guarantee the same order of event
 * occurrence throughout worker, popup and content.
 *
 * It also listens for actions being emitted by the worker to re-integrate into
 * its local pipeline. */
export const relayMiddleware = ({ endpoint, tabId }: ProxyActionsMiddlewareOptions): Middleware => {
    const messageFactory = resolveMessageFactory(endpoint);

    return () => (next) => {
        ExtensionContext.get().port.onMessage.addListener((message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.STORE_DISPATCH) {
                const unprocessedAction = !isSynchronousAction(message.payload.action);
                const acceptAction = acceptActionWithReceiver(message.payload.action, endpoint, tabId);

                if (unprocessedAction && acceptAction) next(message.payload.action);
            }
        });

        return (action: unknown) => {
            if (isAction(action)) {
                /* if action should be processed immediately on the client
                 * reducers, forward it before broadcasting to the worker */
                if (isSynchronousAction(action)) next(action);

                /* hydrate the action with the current client's sender data */
                const message = messageFactory({ type: WorkerMessageType.STORE_DISPATCH, payload: { action } });
                message.payload.action = withSender({ endpoint: message.sender, tabId })(message.payload.action);

                sendMessage(message).catch(noop);
            }
        };
    };
};
