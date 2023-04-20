import { Middleware } from 'redux';

import { resolveMessageFactory, sendMessage } from '@proton/pass/extension/message';
import { acceptActionWithReceiver } from '@proton/pass/store/actions/with-receiver';
import { isClientSynchronousAction } from '@proton/pass/store/actions/with-synchronous-client-action';
import { ExtensionEndpoint, TabId, WorkerMessageType, WorkerMessageWithSender } from '@proton/pass/types';
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

                if (unprocessedAction && acceptAction) {
                    next(message.payload.action);
                }
            }
        });

        return (action) => {
            if (isClientSynchronousAction(action)) {
                next(action);
            }

            sendMessage(messageFactory({ type: WorkerMessageType.STORE_ACTION, payload: { action } })).catch(noop);
        };
    };
};
