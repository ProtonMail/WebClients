import { createSlice } from '@reduxjs/toolkit';

import { LUMO_ELIGIBILITY } from '../../../types';
import type { LumoState } from '../../store';

// export enum LUMO_ELIGIBILITY {
//     'Eligible' = 0,
//     'OnWaitlist' = 1,
//     'NotOnWaitlist' = 2
// }

export type EligibilityStatusState = { eligibility: LUMO_ELIGIBILITY | null; recentlyJoined: boolean };

const initialState: EligibilityStatusState = {
    eligibility: null,
    recentlyJoined: false,
};

const eligibilityStatusSlice = createSlice({
    name: 'lumo/eligibilityStatus',
    initialState,
    reducers: {
        updateEligibilityStatus: (state, action) => {
            state.eligibility = action.payload;
        },
        joinWaitlistSuccess: (state) => {
            state.eligibility = LUMO_ELIGIBILITY.OnWaitlist;
            state.recentlyJoined = true;
        },
    },
});

export const { updateEligibilityStatus, joinWaitlistSuccess } = eligibilityStatusSlice.actions;

export default eligibilityStatusSlice.reducer;

export const selectEligibilityStatus = (state: LumoState) => state.eligibilityStatus.eligibility;
export const selectRecentlyJoined = (state: LumoState) => state.eligibilityStatus.recentlyJoined;
export const selectEligibilityStatusState = (state: LumoState) => state.eligibilityStatus;
