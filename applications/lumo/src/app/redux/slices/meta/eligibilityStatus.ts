import { createSlice } from '@reduxjs/toolkit';

import type { LUMO_ELIGIBILITY } from '../../../types';

// export enum LUMO_ELIGIBILITY {
//     'Eligible' = 0,
//     'OnWaitlist' = 1,
//     'NotOnWaitlist' = 2
// }

type EligibilityStatusState = { eligibility: LUMO_ELIGIBILITY | null; recentlyJoined: boolean };

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
    },
});

export const { updateEligibilityStatus } = eligibilityStatusSlice.actions;

export default eligibilityStatusSlice.reducer;
