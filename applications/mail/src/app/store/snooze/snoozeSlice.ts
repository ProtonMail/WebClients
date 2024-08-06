import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Element } from '../../models/element';

interface SnoozeState {
    element?: Element;
    dropdownState: 'open' | 'close' | 'forceOpen';
}

export const snoozeInitialState: SnoozeState = {
    element: undefined,
    dropdownState: 'close',
};

const name = 'snooze';
const snoozeSlice = createSlice({
    name,
    initialState: snoozeInitialState,
    reducers: {
        resetSnoozeDropdown: (state) => {
            state.dropdownState = 'close';
            state.element = undefined;
        },
        setSnoozeDropdown: (state, action: PayloadAction<SnoozeState>) => {
            state.dropdownState = action.payload.dropdownState;
            state.element = action.payload.element;
        },
        setSnoozeDropdownOpen: (state) => {
            state.dropdownState = 'open';
        },
    },
});

export const snoozeActions = snoozeSlice.actions;

export const snoozeReducer = { [name]: snoozeSlice.reducer };
