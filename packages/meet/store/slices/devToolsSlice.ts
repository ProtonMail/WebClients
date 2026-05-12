import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

export interface DevToolsState {
    krispDebug: boolean;
}

export const initialState: DevToolsState = {
    krispDebug: false,
};

const slice = createSlice({
    name: 'devTools',
    initialState,
    reducers: {
        toggleKrispDebug: (state) => {
            state.krispDebug = !state.krispDebug;
        },
    },
});

export const selectKrispDebug = (state: MeetState) => state.devTools.krispDebug;

export const { toggleKrispDebug } = slice.actions;

export const devToolsReducer = { devTools: slice.reducer };
