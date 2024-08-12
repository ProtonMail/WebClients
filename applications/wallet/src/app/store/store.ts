import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { type WalletThunkArguments, extraThunkArguments } from '@proton/wallet/store/thunk';

import { start } from './listener';
import { rootReducer } from './rootReducer';

export type WalletState = ReturnType<typeof rootReducer>;

export const setupStore = () => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as AppStartListening;
    start(startListening);

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start(startListening);
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {},
    });
};

export const extendStore = (newThunkArguments: Partial<WalletThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type WalletStore = ReturnType<typeof setupStore>;
export type WalletDispatch = WalletStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;

export type AppStartListening = TypedStartListening<WalletState, WalletDispatch, ExtraArgument>;
