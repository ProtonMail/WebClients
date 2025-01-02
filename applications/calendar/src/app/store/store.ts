import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { getPersistedState } from '@proton/redux-shared-store/persist';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { start } from './listener';
import { type CalendarState, persistReducer, rootReducer } from './rootReducer';
import { type CalendarThunkArguments, extraThunkArguments } from './thunk';

export type { CalendarState };

export const setupStore = ({
    preloadedState,
    persist,
    isAccountSessionsEnabled,
}: {
    preloadedState?: Partial<CalendarState>;
    persist?: Boolean;
    isAccountSessionsEnabled?: boolean;
}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        preloadedState,
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

    const startListening = listenerMiddleware.startListening as AppStartListening;
    const getCalendarPersistedState = persist
        ? (state: CalendarState) => getPersistedState(state, persistReducer)
        : undefined;
    start({ startListening, persistTransformer: getCalendarPersistedState, isAccountSessionsEnabled });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, persistTransformer: getCalendarPersistedState, isAccountSessionsEnabled });
        });
    }

    return Object.assign(store, {
        unsubscribe: () => {
            listenerMiddleware.clearListeners();
        },
    });
};

export const extendStore = (newThunkArguments: Partial<CalendarThunkArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};

export type CalendarStore = ReturnType<typeof setupStore>;
export type CalendarDispatch = CalendarStore['dispatch'];
type ExtraArgument = typeof extraThunkArguments;
export type CalendarThunkExtra = {
    state: CalendarState;
    dispatch: CalendarDispatch;
    extra: ExtraArgument;
};

export type AppStartListening = TypedStartListening<CalendarState, CalendarDispatch, ExtraArgument>;
