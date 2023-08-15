import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Element } from '../../models/element';

interface LayoutState {
    element?: Element;
    dropdownState: boolean;
}

const initialState: LayoutState = {
    element: undefined,
    dropdownState: false,
};

const snoozeSlice = createSlice({
    name: 'snooze',
    initialState,
    reducers: {
        resetSnoozeDropdown: (state) => {
            state.dropdownState = false;
            state.element = undefined;
        },
        setSnoozeDropdown: (state, action: PayloadAction<LayoutState>) => {
            state.dropdownState = action.payload.dropdownState;
            state.element = action.payload.element;
        },
    },
});

export const snoozeActions = snoozeSlice.actions;

export default snoozeSlice.reducer;
