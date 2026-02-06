import type { TypedStartListening } from '@reduxjs/toolkit';
import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { MeetEventResponse } from '@proton/shared/lib/interfaces/Meet';
import noop from '@proton/utils/noop';

import { start } from './listeners';
import { type MeetState, rootReducer } from './rootReducer';

export interface MeetExtraThunkArguments extends ProtonThunkArguments {
    meetEventManager: EventManager<MeetEventResponse>;
    notificationsManager?: NotificationsManager;
}

export const setupStore = ({
    extraThunkArguments,
    preloadedState,
    persist,
}: {
    extraThunkArguments: MeetExtraThunkArguments;
    preloadedState?: Partial<MeetState>;
    persist?: boolean;
}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as MeetAppStartListening;
    start({ startListening, persist });

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(rootReducer));
        module.hot.accept('./listeners', () => {
            listenerMiddleware.clearListeners();
            start({ startListening, persist });
        });
    }

    return { ...store, unsubscribe: noop };
};

export type { MeetState };
export type MeetStore = ReturnType<typeof setupStore>;
export type MeetDispatch = MeetStore['dispatch'];

export type MeetAppStartListening = TypedStartListening<MeetState, MeetDispatch, ProtonThunkArguments>;
