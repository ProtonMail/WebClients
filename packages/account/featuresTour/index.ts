import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { FeatureTourStepId } from '@proton/components/components/featureTour/interface';

const name = 'featureTour' as const;

interface State {
    display: boolean;
    steps: FeatureTourStepId[];
}

export interface FeaturesTourState {
    [name]: State;
}

const initialState: State = {
    display: false,
    steps: [],
};

export const slice = createSlice({
    name,
    initialState,
    reducers: {
        display: (state, action: PayloadAction<{ steps: FeatureTourStepId[] }>) => {
            state.display = true;
            state.steps = action.payload.steps || [];
        },
        hide: (state) => {
            state.display = false;
            state.steps = [];
        },
    },
});

export const featureTourReducer = { [name]: slice.reducer };
export const featureTourActions = slice.actions;

type SelectorState = { [name]: State };
export const selectFeatureTour = (state: SelectorState) => state[name];
