import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { getPersistedState } from '@proton/redux-shared-store/persist';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { start } from './listener';
import { AccountState, persistReducer, rootReducer } from './rootReducer';
import { type AccountThunkArguments, extraThunkArguments } from './thunk';

export type { AccountState } from './rootReducer';

export const setupStore = ({ preloadedState, mode }: { preloadedState?: Partial<AccountState>, mode: 'public' | 'lite' | 'default' }) => {
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
    const getAccountPersistedState = (state: AccountState) => getPersistedState(state, persistReducer);
    start({ startListening, mode, persistTransformer: getAccountPersistedState });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, mode, persistTransformer: getAccountPersistedState });
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<AccountThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type AccountStore = ReturnType<typeof setupStore>;
export type AccountDispatch = AccountStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;

export type AppStartListening = TypedStartListening<AccountState, AccountDispatch, ExtraArgument>;
