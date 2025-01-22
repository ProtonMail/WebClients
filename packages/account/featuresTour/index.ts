import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { FeatureTourStepId } from '@proton/components/components/featureTour/interface';

const name = 'featureTour' as const;

export type FeatureTourTelemetryFeature = 'short-domain' | 'auto-delete' | 'dark-web-monitoring';

interface State {
    display: boolean;
    steps: FeatureTourStepId[];
    /**
     * Features activated during feature tour.
     */
    activatedFeatures: FeatureTourTelemetryFeature[];
    /**
     * Origin of the feature tour display.
     * For ex it helps know if user triggered the feature tour from post subscription modal or drawer.
     * @default undefined
     */
    origin: 'postSubscription' | 'drawer' | undefined;
}

export interface FeaturesTourState {
    [name]: State;
}

const initialState: State = {
    display: false,
    origin: undefined,
    activatedFeatures: [],
    steps: [],
};

export const slice = createSlice({
    name,
    initialState,
    reducers: {
        display: (state, action: PayloadAction<{ steps: State['steps']; origin: State['origin'] }>) => {
            state.display = true;
            state.origin = action.payload.origin;
            state.steps = action.payload.steps || [];
        },
        hide: (state) => {
            Object.assign(state, initialState);
        },
        activateFeature: (state, action: PayloadAction<{ feature: State['activatedFeatures'][number] }>) => {
            state.activatedFeatures = [...state.activatedFeatures, action.payload.feature];
        },
    },
});

export const featureTourReducer = { [name]: slice.reducer };
export const featureTourActions = slice.actions;

type SelectorState = { [name]: State };
export const selectFeatureTour = (state: SelectorState) => state[name];
