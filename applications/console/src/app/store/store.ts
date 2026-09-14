import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { start } from './listener';
import { rootReducer } from './rootReducer';
import { type ConsoleThunkArguments, extraThunkArguments } from './thunk';

export type ConsoleState = ReturnType<typeof rootReducer>;

export const setupStore = ({ preloadedState }: { preloadedState?: Partial<ConsoleState> } = {}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [...ignoredActions],
                    ignoredPaths: [...ignoredPaths],
                },
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as AppStartListening;
    start({ startListening });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening });
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<ConsoleThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type ConsoleStore = ReturnType<typeof setupStore>;
type ConsoleDispatch = ConsoleStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;

export type AppStartListening = TypedStartListening<ConsoleState, ConsoleDispatch, ExtraArgument>;
