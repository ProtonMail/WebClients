import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import {
    type ListEligibleTrialsResponse,
    listEligibleTrials as listEligibleTrialsApi,
} from '@proton/shared/lib/api/core/referrals';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

/**
 * Extended thunk arguments that include unauthenticated API
 * This is needed because the trials endpoint requires unauthenticated access
 */
export interface EligibleTrialsThunkArguments extends ProtonThunkArguments {
    unauthenticatedApi: UnauthenticatedApi;
}

export interface EligibleTrials {
    trialPlans: string[];
    creditCardRequiredPlans: string[];
}

/**
 * Default values matching the current hardcoded behavior
 * These serve as optimistic defaults while the API response loads
 */
export const eligibleTrialsDefaultValue: EligibleTrials = {
    trialPlans: ['bundle2022', 'mail2022', 'drive2022', 'pass2023', 'vpn2024'],
    creditCardRequiredPlans: ['bundle2022', 'vpn2024'],
};

const name = 'eligibleTrials' as const;

export interface EligibleTrialsState {
    [name]: ModelState<EligibleTrials>;
}

type SliceState = EligibleTrialsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectEligibleTrials = (state: EligibleTrialsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, EligibleTrialsState, EligibleTrialsThunkArguments, string>(
    `${name}/fetch`,
    {
        miss: async ({ extraArgument, options }) => {
            const referralIdentifier = options?.thunkArg;
            if (!referralIdentifier) {
                // No identifier provided, return defaults
                return eligibleTrialsDefaultValue;
            }

            try {
                // Use unauthenticated API since this endpoint has UNAUTH scope
                const api = extraArgument.unauthenticatedApi?.apiCallback ?? extraArgument.api;
                const response = await api<ListEligibleTrialsResponse>(listEligibleTrialsApi(referralIdentifier));
                return {
                    trialPlans: response.TrialPlans,
                    creditCardRequiredPlans: response.CreditCardRequiredPlans,
                };
            } catch {
                // On error, return defaults
                return eligibleTrialsDefaultValue;
            }
        },
        previous: previousSelector(selectEligibleTrials),
    }
);

const initialState = getInitialModelState<Model>(eligibleTrialsDefaultValue);

const slice = createSlice({
    name,
    initialState,
    reducers: {
        /**
         * Manually set eligible trials (useful for optimistic updates)
         */
        set: (state, action: PayloadAction<EligibleTrials>) => {
            state.value = action.payload;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const eligibleTrialsReducer = { [name]: slice.reducer };
export const eligibleTrialsThunk = modelThunk.thunk;
export const setEligibleTrials = slice.actions.set;
