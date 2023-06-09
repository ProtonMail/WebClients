import { configureStore } from '@reduxjs/toolkit';
import devToolsEnhancer from 'remote-redux-devtools';

import reducer from '@proton/pass/store/reducers';
import type { ExtensionEndpoint, TabId } from '@proton/pass/types';

import { proxyActionsMiddleware } from './proxy-actions.middleware';

const createClientStore = (endpoint: ExtensionEndpoint, tabId: TabId) => {
    const store = configureStore({
        reducer,
        middleware: [proxyActionsMiddleware({ endpoint, tabId })],
        enhancers:
            ENV === 'development'
                ? [
                      devToolsEnhancer({
                          name: `${endpoint}-${tabId}`,
                          port: 8000,
                          realtime: true,
                          secure: true,
                      }),
                  ]
                : [],
    });

    return store;
};

export default createClientStore;
