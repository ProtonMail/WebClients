import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getFreePlan, queryPlans } from '@proton/shared/lib/api/payments';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';

const name = 'plans';

export interface PlansState {
    [name]: ModelState<{ plans: Plan[]; freePlan: FreePlanDefault }>;
}

type SliceState = PlansState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPlans = (state: PlansState) => state.plans;

const modelThunk = createAsyncModelThunk<Model, PlansState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const plans = extraArgument.api<{ Plans: Plan[] }>(queryPlans()).then(({ Plans }) => {
            return Plans;
        });
        const freePlan = getFreePlan({
            api: extraArgument.api,
        });
        return {
            plans: await plans,
            freePlan: await freePlan,
        };
    },
    previous: previousSelector(selectPlans),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const plansReducer = { [name]: slice.reducer };
export const plansThunk = modelThunk.thunk;
