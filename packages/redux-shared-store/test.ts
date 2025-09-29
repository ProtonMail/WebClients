import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import type { Action, Reducer, ReducersMapObject } from 'redux';

export const getTestStore = <T, A extends Action, S = any, P = S>({
    preloadedState,
    reducer,
    extraThunkArguments,
}: {
    reducer: Reducer<S, A, P> | ReducersMapObject<S, A, P>;
    preloadedState?: P;
    extraThunkArguments: T;
}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });
    const store = configureStore({
        preloadedState,
        reducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    type State = ReturnType<typeof store.getState>;
    type Dispatch = typeof store.dispatch;
    type ExtraArgument = typeof extraThunkArguments;

    type AppStartListening = TypedStartListening<State, Dispatch, ExtraArgument>;
    const startListening = listenerMiddleware.startListening as AppStartListening;
    return {
        store,
        startListening,
    };
};
