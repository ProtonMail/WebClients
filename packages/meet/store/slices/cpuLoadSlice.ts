import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

export const CPU_LOAD_DROPS_IN_APPLY_ORDER = ['incomingVideoQuality', 'backgroundModel', 'publishedHighLayer'] as const;

export type CpuLoadDrop = (typeof CPU_LOAD_DROPS_IN_APPLY_ORDER)[number];

export interface CpuLoadState {
    dropCount: number;
}

export const initialState: CpuLoadState = {
    dropCount: 0,
};

const slice = createSlice({
    name: 'cpuLoad',
    initialState,
    reducers: {
        setCpuLoadDropCount: (state, action: PayloadAction<number>) => {
            state.dropCount = Math.min(Math.max(action.payload, 0), CPU_LOAD_DROPS_IN_APPLY_ORDER.length);
        },
        resetCpuLoad: (state) => {
            state.dropCount = initialState.dropCount;
        },
    },
});

export const selectCpuLoadDropCount = (state: MeetState) => state.cpuLoad.dropCount;
export const selectIsCpuLoadDropActive = (state: MeetState, drop: CpuLoadDrop) =>
    state.cpuLoad.dropCount > CPU_LOAD_DROPS_IN_APPLY_ORDER.indexOf(drop);

export const { setCpuLoadDropCount, resetCpuLoad } = slice.actions;

export const cpuLoadReducer = { cpuLoad: slice.reducer };
