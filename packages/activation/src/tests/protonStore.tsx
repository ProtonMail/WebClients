import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { addressesReducer, userReducer } from '@proton/account';
import { calendarsReducer } from '@proton/calendar/calendars';
import { featuresReducer } from '@proton/features';
import { categoriesReducer } from '@proton/mail/store/labels';
import { importerConfigReducer } from '@proton/mail/store/importerConfig';
import { mailSettingsReducer } from '@proton/mail/store/mailSettings';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

const extraThunkArguments = {} as ProtonThunkArguments;

const listenerMiddleware = createListenerMiddleware();

const rootReducer = combineReducers({
    ...userReducer,
    ...addressesReducer,
    ...mailSettingsReducer,
    ...categoriesReducer,
    ...importerConfigReducer,
    ...calendarsReducer,
    features: featuresReducer.reducer,
});
type ActivationState = ReturnType<typeof rootReducer>;
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
