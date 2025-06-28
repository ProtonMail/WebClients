import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';
import { ExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { chunkMiddleware } from 'proton-pass-extension/lib/store/chunk.middleware';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isSynchronousAction } from '@proton/pass/store/actions/enhancers/client';
import { isActionFor, isActionFrom } from '@proton/pass/store/actions/enhancers/endpoint';
import reducer from '@proton/pass/store/reducers';
import { requestMiddlewareFactory } from '@proton/pass/store/request/middleware';
import type { ClientEndpoint, TabId } from '@proton/pass/types';
import { not } from '@proton/pass/utils/fp/predicates';

import { relayMiddleware } from './relay.middleware';

export const createClientStore = (endpoint: ClientEndpoint, tabId: TabId) => {
    const store = configureStore({
        reducer,
        middleware: (mw) =>
            mw({ serializableCheck: false, immutableCheck: false, thunk: false }).concat(
                requestMiddlewareFactory({ acceptAsync: not(isActionFrom('background')) }),
                relayMiddleware({ endpoint, tabId }),
                chunkMiddleware()
            ),
        enhancers: (e) =>
            e().concat(
                ENV === 'development'
                    ? [
                          devToolsEnhancer({
                              name: `store::${endpoint}`,
                              port: REDUX_DEVTOOLS_PORT,
                              realtime: true,
                          }),
                      ]
                    : []
            ),

        devTools: false,
    });

    /** Message listener that processes Redux actions from the worker process.
     * This listener handles re-emitted actions from the worker to maintain
     * consistent state across extension contexts. The flow is as follows:
     *
     * 1. Verify message is a store dispatch from the background worker
     * 2. Skip already processed synchronous actions to prevent duplication
     * 3. Only accept actions targeted for this context (endpoint/tabId) */
    ExtensionContext.get().port.onMessage.addListener((message: unknown) => {
        if (matchExtensionMessage(message, { sender: 'background', type: WorkerMessageType.STORE_DISPATCH })) {
            const unprocessedAction = !isSynchronousAction(message.payload.action);
            const acceptAction = isActionFor(message.payload.action, endpoint, tabId);

            if (unprocessedAction && acceptAction) store.dispatch(message.payload.action);
        }
    });

    return store;
};
