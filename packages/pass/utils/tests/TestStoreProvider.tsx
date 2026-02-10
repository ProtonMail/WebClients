import { type FC, type PropsWithChildren, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import type { AuthService } from '@proton/pass/lib/auth/service';
import { authStore, createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { sagaEvents } from '@proton/pass/store/events';
import reducer from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { requestMiddleware } from '@proton/pass/store/request/middleware';
import { rootSagaFactory } from '@proton/pass/store/sagas';
import { WEB_SAGAS } from '@proton/pass/store/sagas/web';
import createStore from '@proton/shared/lib/helpers/store';

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

exposeAuthStore(createAuthStore(createStore()));

export const TestStoreProvider: FC<PropsWithChildren> = ({ children }) => {
    const config = usePassConfig();
    const core = usePassCore();

    useEffect(() => {
        const runner = sagaMiddleware.run(
            rootSagaFactory(WEB_SAGAS).bind(null, {
                endpoint: 'web',
                publish: sagaEvents.publish,
                getConfig: () => config,
                getCore: () => core.core,
                getAppState: () => AppStateManager.getState(),
                setAppStatus: AppStateManager.setStatus,
                getAuthService: () => ({}) as AuthService,
                getAuthStore: () => authStore,
                getCache: async () => ({}),
                getPollingInterval: () => ACTIVE_POLLING_TIMEOUT,
                getSettings: () => ({}) as ProxiedSettings,
                getTelemetry: () => null,
                setCache: async () => undefined,
                onNotification: () => {},
            })
        );

        /** When hot-reloading: this `useEffect` can re-trigger,
         * so cancel the on-going saga runner. */
        return () => runner.cancel();
    }, []);

    return <ReduxProvider store={store}>{children}</ReduxProvider>;
};
