import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths, startSharedListening } from '@proton/redux-shared-store';

import { rootReducer } from './rootReducer';
import { DriveThunkArguments, extraThunkArguments } from './thunk';

export const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
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

export const extendStore = (newThunkArguments: DriveThunkArguments) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type DriveState = ReturnType<typeof store.getState>;
export type DriveDispatch = typeof store.dispatch;
type ExtraArgument = typeof extraThunkArguments;

type AppStartListening = TypedStartListening<DriveState, DriveDispatch, ExtraArgument>;
const startListening = listenerMiddleware.startListening as AppStartListening;

startSharedListening(startListening);
