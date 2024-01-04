import { TypedStartListening, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import type { NoInfer } from '@reduxjs/toolkit/src/tsHelpers';
import type { Action, CombinedState, PreloadedState, Reducer, ReducersMapObject } from 'redux';

export const getTestStore = <T, A extends Action, S = any>({
    preloadedState,
    reducer,
    extraThunkArguments,
}: {
    reducer: Reducer<S, A> | ReducersMapObject<S, A>;
    preloadedState?: PreloadedState<CombinedState<NoInfer<S>>>;
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
