import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { errorMiddleware } from 'proton-mail/store/middleware';

import { start } from './listener';
import { type MailState, rootReducer } from './rootReducer';
import { mailIgnoredActionPaths, mailIgnoredPaths } from './serializable';
import { type MailThunkArguments, extraThunkArguments } from './thunk';

export type { MailState };

export const setupStore = ({ preloadedState }: { preloadedState?: Partial<MailState> } = {}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const isTest = process.env.NODE_ENV === 'test';
    const immutableCheck = isTest
        ? false
        : {
              warnAfter: 32,
          };

    const serializableCheck = isTest
        ? false
        : {
              ignoredActions,
              ignoredPaths: [...ignoredPaths, ...mailIgnoredPaths],
              ignoredActionPaths: mailIgnoredActionPaths,
              warnAfter: 32,
          };

    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) => {
            return getDefaultMiddleware({
                serializableCheck,
                immutableCheck,
                thunk: { extraArgument: extraThunkArguments },
            })
                .prepend(listenerMiddleware.middleware)
                .concat(errorMiddleware);
        },
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
