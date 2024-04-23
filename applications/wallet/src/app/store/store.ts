import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

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

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
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
