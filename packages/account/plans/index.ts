import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryPlans } from '@proton/shared/lib/api/payments';
import type { Plan } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';

const name = 'plans';

export interface PlansState {
    [name]: ModelState<Plan[]>;
}

type SliceState = PlansState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPlans = (state: PlansState) => state.plans;

const modelThunk = createAsyncModelThunk<Model, PlansState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ Plans: Plan[] }>(queryPlans()).then(({ Plans }) => {
            return Plans;
        });
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
