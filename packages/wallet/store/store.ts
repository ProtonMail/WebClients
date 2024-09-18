import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { start } from './listeners';
import { rootReducer } from './rootReducer';
import { type WalletThunkArguments, extraThunkArguments } from './thunk';

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
        module.hot.accept('./listeners', () => {
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
export type WalletThunkExtra = {
    state: WalletState;
    dispatch: WalletDispatch;
    extra: ExtraArgument;
};

export type AppStartListening = TypedStartListening<WalletState, WalletDispatch, ExtraArgument>;
