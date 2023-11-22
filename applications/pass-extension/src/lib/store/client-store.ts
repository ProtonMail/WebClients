import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';

import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import reducer from '@proton/pass/store/reducers';
import type { ClientEndpoint, TabId } from '@proton/pass/types';

import { proxyActionsMiddleware } from './proxy-actions.middleware';

export const createClientStore = (endpoint: ClientEndpoint, tabId: TabId) => {
    const store = configureStore({
        reducer,
        middleware: [requestMiddleware, proxyActionsMiddleware({ endpoint, tabId })],
        enhancers:
            ENV === 'development'
                ? [
                      devToolsEnhancer({
                          name: `${endpoint}-${tabId}`,
                          realtime: true,
                          port: REDUX_DEVTOOLS_PORT,
                      }),
                  ]
                : [],
    });

    return store;
};
