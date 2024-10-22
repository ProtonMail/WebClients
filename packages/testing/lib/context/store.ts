import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { sharedReducers } from '@proton/redux-shared-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

export const extraThunkArguments = {} as ProtonThunkArguments;

export const listenerMiddleware = createListenerMiddleware();

const rootReducer = combineReducers({
    ...sharedReducers,
});
export type RootState = ReturnType<typeof rootReducer>;
export const setupStore = ({ preloadedState }: { preloadedState: Partial<RootState> }) => {
    return configureStore({
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
};

export const extendStore = (newThunkArguments: Partial<ProtonThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};
