import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths, startSharedListening } from '@proton/redux-shared-store';

import { rootReducer } from './rootReducer';
import { MailThunkArguments, extraThunkArguments } from './thunk';

export const listenerMiddleware = createListenerMiddleware();

export type MailState = ReturnType<typeof rootReducer>;
export const setupStore = ({ preloadedState }: { preloadedState?: MailState } = {}) => {
    const store = configureStore({
        preloadedState,
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [...ignoredActions],
                    ignoredPaths: [...ignoredPaths],
                },
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
    }

    return store;
};

export const extendStore = (newThunkArguments: MailThunkArguments) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type MailStore = ReturnType<typeof setupStore>;
export type MailDispatch = MailStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;

type AppStartListening = TypedStartListening<MailState, MailDispatch, ExtraArgument>;
const startListening = listenerMiddleware.startListening as AppStartListening;

startSharedListening(startListening);
