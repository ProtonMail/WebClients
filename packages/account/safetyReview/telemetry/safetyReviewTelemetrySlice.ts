import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { SafetyReviewRecoveryState } from './interfaces';
import { type SafetyReviewCohort, getCohort } from './utils/getCohort';
import type { SafetyReviewSource } from './utils/getSource';
import type { SafetyReviewTelemetrySession } from './utils/getValidSafetyReviewSession';

const name = 'safetyReviewTelemetry' as const;

interface SafetyReviewCheckupState {
    cohort: SafetyReviewCohort | undefined;
    session: SafetyReviewTelemetrySession | undefined;
    source?: SafetyReviewSource;
    recoveryState: SafetyReviewRecoveryState;
}

export interface SafetyReviewReduxState {
    [name]: SafetyReviewCheckupState;
}

const initialState: SafetyReviewCheckupState = {
    cohort: undefined,
    session: undefined,
    source: undefined,
    recoveryState: {
        email: {
            isEnabled: false,
            hasValue: false,
        },
        phone: {
            isEnabled: false,
            hasValue: false,
        },
        deviceRecovery: {
            isAvailable: false,
            isEnabled: false,
        },
        phrase: {
            isAvailable: false,
            isSet: false,
        },
        recoveryContactsData: { isAvailable: false, isEnabled: false },
        emergencyContactsData: { isAvailable: false, isEnabled: false },
    },
};

export const safetyReviewTelemetrySlice = createSlice({
    name,
    initialState,
    reducers: {
        setRecoveryState: (state, action: PayloadAction<SafetyReviewRecoveryState>) => {
            state.recoveryState = action.payload;
            state.cohort = getCohort(action.payload);
        },
        setSession: (state, { payload: { session } }: PayloadAction<{ session: SafetyReviewTelemetrySession }>) => {
            state.session = session;
        },
        clearSession: (state) => {
            state.session = undefined;
        },
        setSource: (state, { payload: { source } }: PayloadAction<{ source: SafetyReviewSource | undefined }>) => {
            state.source = source;
        },
        clearSource: (state) => {
            state.source = undefined;
        },
    },
});

export const safetyReviewTelemetryReducer = { [name]: safetyReviewTelemetrySlice.reducer };

export const selectSafetyReviewTelemetry = (state: { [name]: SafetyReviewCheckupState }) => state[name];
