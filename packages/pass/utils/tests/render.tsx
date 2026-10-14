import type { ReactNode } from 'react';

import { render as testingLibraryRender } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import type { TestCoreOverrides } from './TestCoreProvider';
import { createTestStore } from './TestStoreProvider';
import type { TestAppInit } from './app';
import { setupTestApp } from './app';
import { TestContext } from './context';
import type { TestStateInit } from './state';
import { createTestState } from './state';

export type TestRenderOptions = {
    app?: TestAppInit;
    state?: TestStateInit;
    core?: TestCoreOverrides;
    route?: string;
};

export const render = (ui: ReactNode, { app, state, core, route = '/' }: TestRenderOptions = {}) => {
    const authStore = setupTestApp(app);
    const history = createMemoryHistory({ initialEntries: [route] });
    const { store, sagaMiddleware } = createTestStore(createTestState(state));

    const result = testingLibraryRender(
        <TestContext authStore={authStore} core={core} history={history} store={store} sagaMiddleware={sagaMiddleware}>
            {ui}
        </TestContext>
    );

    return { ...result, authStore, store, history };
};
