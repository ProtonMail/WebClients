import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { calendarsReducer } from '@proton/calendar';
import { type ProtonThunkArguments, sharedReducers } from '@proton/redux-shared-store';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

export const extraThunkArguments = {} as ProtonThunkArguments;

export const listenerMiddleware = createListenerMiddleware();

const rootReducer = combineReducers({
    ...sharedReducers,
    ...calendarsReducer,
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
