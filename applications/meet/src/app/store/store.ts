import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import noop from '@proton/utils/noop';

import { start } from './listeners';
import { rootReducer } from './rootReducer';

interface MeetExtraThunkArguments extends ProtonThunkArguments {
    notificationsManager?: NotificationsManager;
}

export const setupStore = (extraThunkArguments: MeetExtraThunkArguments) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as MeetAppStartListening;
    start(startListening);

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listeners', () => {
            listenerMiddleware.clearListeners();
            start(startListening);
        });
    }

    return { ...store, unsubscribe: noop };
};

export type MeetState = ReturnType<typeof rootReducer>;

export type MeetStore = ReturnType<typeof setupStore>;
export type MeetDispatch = MeetStore['dispatch'];

export type MeetAppStartListening = TypedStartListening<MeetState, MeetDispatch, ProtonThunkArguments>;
