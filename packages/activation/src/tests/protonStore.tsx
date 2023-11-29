import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { addressesReducer, userReducer } from '@proton/account';
import { featuresReducer } from '@proton/features';
import { categoriesReducer, importerConfigReducer, mailSettingsReducer } from '@proton/mail';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';

export const extraThunkArguments = {} as ProtonThunkArguments;

export const listenerMiddleware = createListenerMiddleware();

const rootReducer = combineReducers({
    ...userReducer,
    ...addressesReducer,
    ...mailSettingsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    features: featuresReducer.reducer,
});
export type ActivationState = ReturnType<typeof rootReducer>;
export const setupStore = ({ preloadedState }: { preloadedState?: ActivationState } = {}) => {
    return configureStore({
        preloadedState,
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {},
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });
};

export type ActivationStore = ReturnType<typeof setupStore>;
export type ActivationDispatch = ActivationStore['dispatch'];
