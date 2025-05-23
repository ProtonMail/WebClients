import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Action } from 'redux';
import { type Middleware, isAction } from 'redux';

import { actionStream } from '@proton/pass/store/actions';
import { isBackgroundAction, isStreamableAction } from '@proton/pass/store/actions/enhancers/client';
import { isActionWithReceiver, withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { State } from '@proton/pass/store/types';
import { not } from '@proton/pass/utils/fp/predicates';
import { toChunks } from '@proton/pass/utils/object/chunk';

const broadcast = (action: Action) =>
    WorkerMessageBroker.ports.broadcast(
        backgroundMessage({
            type: WorkerMessageType.STORE_DISPATCH,
            payload: { action: withSender({ endpoint: 'background' })(action) },
        }),
        (name) => /^(popup|page)/.test(name)
    );

/** Middleware that broadcasts Redux actions from the worker to all clients.
 * This middleware handles broadcasting store updates to extension clients
 * to maintain consistent state. The flow is as follows:
 * 1. Sanitize action and mark as worker-originated
 * 2. Broadcast to popup/page clients via ports */
export const broadcastMiddleware: Middleware<{}, State> = () => (next) => (action: unknown) => {
    if (isAction(action) && not(isBackgroundAction)(action)) {
        if (EXTENSION_BUILD && isStreamableAction(action)) {
            const options = isActionWithReceiver(action) ? action.meta.receiver : {};
            for (const chunk of toChunks(action)) broadcast(actionStream(chunk, options));
        } else broadcast(action);

        next(action);
    }
};
