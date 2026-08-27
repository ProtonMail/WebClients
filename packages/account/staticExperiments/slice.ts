import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { StaticExperimentsState } from './types';

const name = 'staticExperiments' as const;

export interface StaticExperimentsReducerState {
    [name]: StaticExperimentsState;
}

export const selectStaticExperiments = (state: StaticExperimentsReducerState) => state[name];

const slice = createSlice({
    name: name,
    initialState: {} as StaticExperimentsState,
    reducers: {
        set: (state, action: PayloadAction<StaticExperimentsState>) => {
            Object.assign(state, action.payload);
        },
    },
});

export const staticExperimentsActions = slice.actions;
export const staticExperimentsReducer = { [name]: slice.reducer };
