import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { plansReducer } from '@proton/account';
import { type ProtonThunkArguments, ignoredActions, ignoredPaths } from '@proton/redux-shared-store';
import { sharedReducers } from '@proton/redux-shared-store';

export const extraThunkArguments = {} as ProtonThunkArguments;

export const listenerMiddleware = createListenerMiddleware();

const rootReducer = combineReducers({
    ...sharedReducers,
    ...plansReducer,
});
export type RootState = ReturnType<typeof rootReducer>;
export const setupStore = ({ preloadedState }: { preloadedState: RootState }) => {
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

export const extendStore = (newThunkArguments: ProtonThunkArguments) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};
