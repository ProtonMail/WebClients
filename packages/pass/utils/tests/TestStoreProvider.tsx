import { type FC, type PropsWithChildren, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { AppStateManager } from '../../components/Core/AppStateManager';
import { usePassCore } from '../../components/Core/PassCoreProvider';
import { usePassConfig } from '../../hooks/usePassConfig';
import type { AuthService } from '../../lib/auth/service';
import { authStore, createAuthStore, exposeAuthStore } from '../../lib/auth/store';
import { ACTIVE_POLLING_TIMEOUT } from '../../lib/events/constants';
import { sagaEvents } from '../../store/events';
import reducer from '../../store/reducers';
import type { ProxiedSettings } from '../../store/reducers/settings';
import { requestMiddleware } from '../../store/request/middleware';
import { rootSagaFactory } from '../../store/sagas';
import { WEB_SAGAS } from '../../store/sagas/web';
import { createMemoryStore } from '../store';

export const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
    reducer,
    middleware: (mw) =>
        mw({
            serializableCheck: false,
            thunk: false,
            immutableCheck: false,
        }).concat(requestMiddleware, sagaMiddleware),
    devTools: ENV !== 'production',
});

exposeAuthStore(createAuthStore(createMemoryStore()));

export const TestStoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const config = usePassConfig();
    const core = usePassCore();

    useEffect(() => {
        const runner = sagaMiddleware.run(
            rootSagaFactory(WEB_SAGAS).bind(null, {
                endpoint: 'web',
                getAppState: () => AppStateManager.getState(),
                getAuthService: () => ({}) as AuthService,
                getAuthStore: () => authStore,
                getCache: async () => ({}),
                getConfig: () => config,
                getCore: () => core.core,
                getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
                getSettings: () => ({}) as ProxiedSettings,
                getTelemetry: () => null,
                onItemsUpdated: () => {},
                onNotification: () => {},
                publish: sagaEvents.publish,
                setAppStatus: AppStateManager.setStatus,
                setCache: async () => undefined,
            })
        );

        /** When hot-reloading: this `useEffect` can re-trigger,
         * so cancel the on-going saga runner. */
        return () => runner.cancel();
    }, []);

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
