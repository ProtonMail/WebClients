import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { startCalendarEventListener, startHolidayCalendarsListener } from '@proton/calendar';
import { ignoredActions, ignoredPaths, startSharedListening } from '@proton/redux-shared-store';

import { rootReducer } from './rootReducer';
import { AccountThunkArguments, extraThunkArguments } from './thunk';

export const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== 'production',
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

export const extendStore = (newThunkArguments: AccountThunkArguments) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type AccountState = ReturnType<typeof store.getState>;
export type AccountDispatch = typeof store.dispatch;
type ExtraArgument = typeof extraThunkArguments;

type AppStartListening = TypedStartListening<AccountState, AccountDispatch, ExtraArgument>;
const startListening = listenerMiddleware.startListening as AppStartListening;

startSharedListening(startListening);
startCalendarEventListener(startListening);
startHolidayCalendarsListener(startListening);
