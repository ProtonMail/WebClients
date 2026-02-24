import {
    configureStore,
    type ListenerMiddlewareInstance,
    type Middleware,
    type TypedStartListening,
} from '@reduxjs/toolkit';
import type {SagaMiddleware} from 'redux-saga';

import {ignoredActions, ignoredPaths} from '@proton/account/serializable';

import type {DbApi} from '../indexedDb/db';
import type {LumoApi} from '../remote/api';
import {start} from './listeners';
import {rootReducer} from './rootReducer';
import type {LumoThunkArguments} from './thunk';
import {extraThunkArguments} from './thunk';

export const setupStore = ({
    preloadedState,
    listenerMiddleware,
    sagaMiddleware,
}: {
    preloadedState?: Partial<LumoState>;
    listenerMiddleware: LumoListener;
    sagaMiddleware?: SagaMiddleware;
}) => {
    const isDevMode = process.env.NODE_ENV !== 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        devTools: isDevMode,
        middleware: (getDefaultMiddleware) => {
            const m1 = getDefaultMiddleware({
                serializableCheck: isDevMode &&
                    !isTest && {
                        ignoredActions: [...ignoredActions],
                        ignoredPaths: [...ignoredPaths, 'attachments'],
                    },
                immutableCheck: isDevMode && !isTest,
                thunk: { extraArgument: extraThunkArguments },
            });
            const m2 = m1.prepend(listenerMiddleware.middleware);
            return sagaMiddleware ? m2.concat(sagaMiddleware) : m2;
        },
    });

    const startListening = listenerMiddleware.startListening as AppStartListening;
    start(startListening);

    if (isDevMode && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listeners', () => {
            listenerMiddleware.clearListeners();
            start(startListening);
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<LumoThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type LumoState = ReturnType<typeof rootReducer>;
export type LumoStore = ReturnType<typeof setupStore>;
export type LumoDispatch = LumoStore['dispatch'];
export type ExtraArgument = typeof extraThunkArguments;
export type LumoMiddleware = Middleware<{}, LumoState>;
export type LumoListener = LumoMiddleware & ListenerMiddlewareInstance<LumoState>;
export type LumoSagaContext = {
    dbApi: DbApi;
    lumoApi: LumoApi;
};
export type LumoSaga = LumoMiddleware & SagaMiddleware<LumoSagaContext>;
export type AppStartListening = TypedStartListening<LumoState, LumoDispatch, ExtraArgument>;
