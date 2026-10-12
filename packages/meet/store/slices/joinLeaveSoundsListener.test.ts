import { configureStore, createListenerMiddleware, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { joinLeaveSoundsListener } from './joinLeaveSoundsListener';
import {
    getPersistedSettingsState,
    selectJoinLeaveSoundsEnabled,
    setJoinLeaveSoundsEnabledAndPersist,
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

const createStore = () => {
    const listenerMiddleware = createListenerMiddleware();
    joinLeaveSoundsListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);

    const store = configureStore({
        reducer: { ...settingsReducer, user: userSlice.reducer },
        preloadedState: { meetSettings: getPersistedSettingsState() },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    return {
        dispatch: store.dispatch as (action: unknown) => void,
        isEnabled: () => selectJoinLeaveSoundsEnabled(store.getState() as unknown as MeetState),
    };
};

describe('joinLeaveSoundsListener', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('should load the choice of the user once they are known', () => {
        localStorage.setItem('user.user-1.joinLeaveSounds', 'false');
        const { dispatch, isEnabled } = createStore();

        expect(isEnabled()).toBe(true);

        dispatch(userSlice.actions.setUser('user-1'));

        expect(isEnabled()).toBe(false);
    });

    it('should not carry the choice of the guest over to the user', () => {
        const { dispatch, isEnabled } = createStore();

        dispatch(setJoinLeaveSoundsEnabledAndPersist(false));
        dispatch(userSlice.actions.setUser('user-1'));

        expect(isEnabled()).toBe(true);
        expect(localStorage.getItem('guest.joinLeaveSounds')).toBe('false');
    });
});
