import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { type StartListeningFeatures, start } from './listener';
import { type DriveState, rootReducer } from './rootReducer';
import { type DriveThunkArguments, extraThunkArguments } from './thunk';

export type { DriveState };

export const setupStore = ({
    preloadedState,
    features,
}: {
    preloadedState?: Partial<DriveState>;
    features?: StartListeningFeatures;
}) => {
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
    start({ startListening, features });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, features });
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<DriveThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type DriveStore = ReturnType<typeof setupStore>;
export type DriveDispatch = DriveStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;

export type AppStartListening = TypedStartListening<DriveState, DriveDispatch, ExtraArgument>;
