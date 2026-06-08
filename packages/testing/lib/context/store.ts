import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { apiMock } from '../api';

// Mirror the real store, which always carries an `api` in its thunk arguments. Without it, any model
// that isn't preloaded throws `extraArgument.api is not a function` the moment it auto-fetches. Unregistered
// endpoints resolve to `{}` via apiMock, so an unprovided model resolves empty instead of crashing.
export const extraThunkArguments = { api: apiMock } as unknown as ProtonThunkArguments;

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
