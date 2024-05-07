import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { getPersistedState } from '@proton/redux-shared-store/persist';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { start } from './listener';
import { type MailState, persistReducer, rootReducer } from './rootReducer';
import { mailIgnoredActionPaths, mailIgnoredPaths } from './serializable';
import { type MailThunkArguments, extraThunkArguments } from './thunk';

export type { MailState };

export const setupStore = ({
    preloadedState,
    persist,
}: {
    preloadedState?: Partial<MailState>;
    persist?: boolean;
} = {}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions,
                    ignoredPaths: [...ignoredPaths, ...mailIgnoredPaths],
                    ignoredActionPaths: mailIgnoredActionPaths,
                },
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as AppStartListening;
    const getMailPersistedState = persist ? (state: MailState) => getPersistedState(state, persistReducer) : undefined;
    start({ startListening, persistTransformer: getMailPersistedState });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, persistTransformer: getMailPersistedState });
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<MailThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};
export type MailStore = ReturnType<typeof setupStore>;
export type MailDispatch = MailStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;
export type MailThunkExtra = {
    state: MailState;
    dispatch: MailDispatch;
    extra: ExtraArgument;
};

export type AppStartListening = TypedStartListening<MailState, MailDispatch, ExtraArgument>;
