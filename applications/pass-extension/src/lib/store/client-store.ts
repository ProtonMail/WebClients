import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';

import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import reducer from '@proton/pass/store/reducers';
import type { ClientEndpoint, TabId } from '@proton/pass/types';

import { relayMiddleware } from './relay.middleware';

export const createClientStore = (endpoint: ClientEndpoint, tabId: TabId) => {
    const store = configureStore({
        reducer,
        middleware: (mw) =>
            mw({ serializableCheck: false, thunk: false }).concat(
                requestMiddleware,
                relayMiddleware({ endpoint, tabId })
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

    return store;
};
