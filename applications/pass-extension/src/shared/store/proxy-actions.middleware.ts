import type { AnyAction, Middleware } from 'redux';

import { resolveMessageFactory, sendMessage } from '@proton/pass/extension/message';
import { acceptActionWithReceiver, withSender } from '@proton/pass/store/actions/with-receiver';
import { isClientSynchronousAction } from '@proton/pass/store/actions/with-synchronous-client-action';
import type { ExtensionEndpoint, TabId, WorkerMessageWithSender } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { ExtensionContext } from '../extension';

/*
 * This middleware eats all actions coming through on purpose and sends them
 * to the worker for re-emission. This is to guarantee the same order of event
 * occurrence throughout worker, popup and content.
 *
 * It also listens for actions being emitted by the worker to re-integrate into
 * its local pipeline.
 */

type ProxyActionsMiddlewareOptions = {
    endpoint: ExtensionEndpoint;
    tabId: TabId;
};

export const proxyActionsMiddleware = ({ endpoint, tabId }: ProxyActionsMiddlewareOptions): Middleware => {
    const messageFactory = resolveMessageFactory(endpoint);

    return () => (next) => {
        ExtensionContext.get().port.onMessage.addListener((message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.STORE_ACTION) {
                const unprocessedAction = !isClientSynchronousAction(message.payload.action);
                const acceptAction = acceptActionWithReceiver(message.payload.action, endpoint, tabId);

                if (unprocessedAction && acceptAction) next(message.payload.action);
            }
        });

        return (action: AnyAction) => {
            /* if action should be processed immediately on the client
             * reducers, forward it before broadcasting to the worker */
            if (isClientSynchronousAction(action)) next(action);

            /* hydrate the action with the current client's sender data */
            const message = messageFactory({ type: WorkerMessageType.STORE_ACTION, payload: { action } });
            message.payload.action = withSender({ endpoint: message.sender, tabId })(message.payload.action);

            sendMessage(message).catch(noop);
        };
    };
};
