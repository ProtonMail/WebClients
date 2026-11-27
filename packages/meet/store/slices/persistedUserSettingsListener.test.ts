import { configureStore, createListenerMiddleware, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { persistedUserSettingsListener } from './persistedUserSettingsListener';
import {
    getPersistedSettingsState,
    selectJoinLeaveSoundsEnabled,
    selectMirrorSelfView,
    setJoinLeaveSoundsEnabledAndPersist,
    setMirrorSelfViewAndPersist,
    settingsReducer,
} from './settings';

const userSlice = createSlice({
    name: 'user',
    initialState: { value: undefined as { ID: string } | undefined },
    reducers: {
        setUser: (state, action: PayloadAction<string>) => {
            state.value = { ID: action.payload };
        },
    },
});

const createStore = (select: (state: MeetState) => boolean) => {
    const listenerMiddleware = createListenerMiddleware();
    persistedUserSettingsListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);

    const store = configureStore({
        reducer: { ...settingsReducer, user: userSlice.reducer },
        preloadedState: { meetSettings: getPersistedSettingsState() },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    return {
        dispatch: store.dispatch as (action: unknown) => void,
        isEnabled: () => select(store.getState() as unknown as MeetState),
    };
};

describe.each([
    {
        setting: 'join and leave sounds',
        storageName: 'joinLeaveSounds',
        select: selectJoinLeaveSoundsEnabled,
        setAndPersist: setJoinLeaveSoundsEnabledAndPersist,
    },
    {
        setting: 'mirror self view',
        storageName: 'mirrorSelfView',
        select: selectMirrorSelfView,
        setAndPersist: setMirrorSelfViewAndPersist,
    },
])('persistedUserSettingsListener with $setting', ({ storageName, select, setAndPersist }) => {
    afterEach(() => {
        localStorage.clear();
    });

    it('should be on when the user never chose', () => {
        const { dispatch, isEnabled } = createStore(select);

        dispatch(userSlice.actions.setUser('user-1'));

        expect(isEnabled()).toBe(true);
    });

    it('should load the choice of the user once they are known', () => {
        localStorage.setItem(`user.user-1.${storageName}`, 'false');
        const { dispatch, isEnabled } = createStore(select);

        expect(isEnabled()).toBe(true);

        dispatch(userSlice.actions.setUser('user-1'));

        expect(isEnabled()).toBe(false);
    });

    it('should not carry the choice of the guest over to the user', () => {
        const { dispatch, isEnabled } = createStore(select);

        dispatch(setAndPersist(false));
        dispatch(userSlice.actions.setUser('user-1'));

        expect(isEnabled()).toBe(true);
        expect(localStorage.getItem(`guest.${storageName}`)).toBe('false');
    });
});
