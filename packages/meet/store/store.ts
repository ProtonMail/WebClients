import type { ReducersMapObject, TypedStartListening } from '@reduxjs/toolkit';
import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { MeetEventResponse } from '@proton/shared/lib/interfaces/Meet';
import noop from '@proton/utils/noop';

import { start } from './listeners';
import { type MeetState, meetRootReducers, rootReducer } from './rootReducer';
import { getPersistedBackgroundState } from './slices/backgroundSlice';
import { getPersistedSettingsState } from './slices/settings';

export interface MeetExtraThunkArguments extends ProtonThunkArguments {
    meetEventManager: EventManager<MeetEventResponse>;
    notificationsManager?: NotificationsManager;
}

/** Slices the host app adds on top of Meet's own. They are injected rather than imported here because
 * `@proton/components` depends on this package, so this package cannot depend on anything that depends on
 * `@proton/components` (e.g. `@proton/offers-delivery`). */
export interface MeetStoreExtensions<ExtraState> {
    reducers: ReducersMapObject<ExtraState>;
    startListening: (
        startListening: TypedStartListening<MeetState & ExtraState, MeetDispatch, ProtonThunkArguments>
    ) => void;
}

const getReducer = (extensions: MeetStoreExtensions<any> | undefined) =>
    extensions
        ? (combineReducers({ ...meetRootReducers, ...extensions.reducers }) as unknown as typeof rootReducer)
        : rootReducer;

export const setupStore = ({
    extraThunkArguments,
    preloadedState,
    persist,
    extensions,
}: {
    extraThunkArguments: MeetExtraThunkArguments;
    preloadedState?: Partial<MeetState>;
    persist?: boolean;
    extensions?: MeetStoreExtensions<any>;
}) => {
    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        reducer: getReducer(extensions),
        preloadedState: {
            background: getPersistedBackgroundState(),
            meetSettings: getPersistedSettingsState(preloadedState?.user?.value?.ID),
            ...preloadedState,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    const startListening = listenerMiddleware.startListening as MeetAppStartListening;
    const startAll = () => {
        start({ startListening, persist });
        extensions?.startListening(startListening);
    };
    startAll();

    if (process.env.NODE_ENV !== 'production' && module.hot) {
        module.hot.accept('./rootReducer', () => store.replaceReducer(getReducer(extensions)));
        module.hot.accept('./listeners', () => {
            listenerMiddleware.clearListeners();
            startAll();
        });
    }

    return { ...store, unsubscribe: noop };
};

export type { MeetState };
export type MeetStore = ReturnType<typeof setupStore>;
export type MeetDispatch = MeetStore['dispatch'];

export type MeetAppStartListening = TypedStartListening<MeetState, MeetDispatch, ProtonThunkArguments>;
