import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Element } from '../../models/element';

interface SnoozeState {
    element?: Element;
    dropdownState: boolean;
}

export const snoozeInitialState: SnoozeState = {
    element: undefined,
    dropdownState: false,
};

const name = 'snooze';
const snoozeSlice = createSlice({
    name,
    initialState: snoozeInitialState,
    reducers: {
        resetSnoozeDropdown: (state) => {
            state.dropdownState = false;
            state.element = undefined;
        },
        setSnoozeDropdown: (state, action: PayloadAction<SnoozeState>) => {
            state.dropdownState = action.payload.dropdownState;
            state.element = action.payload.element;
        },
    },
});

export const snoozeActions = snoozeSlice.actions;

export const snoozeReducer = { [name]: snoozeSlice.reducer };
