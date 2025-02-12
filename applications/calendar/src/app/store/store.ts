import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { type StartListeningFeatures, start } from './listener';
import { type CalendarState, rootReducer } from './rootReducer';
import { calendarIgnoredActionPaths } from './serializable';
import { type CalendarThunkArguments, extraThunkArguments } from './thunk';

export type { CalendarState };

export const setupStore = ({
    preloadedState,
    features,
}: {
    preloadedState?: Partial<CalendarState>;
    features?: StartListeningFeatures;
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
                    ignoredActionPaths: calendarIgnoredActionPaths,
                },
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as AppStartListening;
    start({ startListening, features });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listener', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, features });
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
