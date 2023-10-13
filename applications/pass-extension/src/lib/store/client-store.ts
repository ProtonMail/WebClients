import { devToolsEnhancer } from '@redux-devtools/remote';
import { configureStore } from '@reduxjs/toolkit';

import reducer from '@proton/pass/store/reducers';
import type { ExtensionEndpoint, TabId } from '@proton/pass/types';

import { proxyActionsMiddleware } from './proxy-actions.middleware';
import { requestMiddleware } from './request-middleware';

export const createClientStore = (endpoint: ExtensionEndpoint, tabId: TabId) => {
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
