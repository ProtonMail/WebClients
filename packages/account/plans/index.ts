import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseCache } from '@proton/redux-utilities';
import { getFreePlan, queryPlans } from '@proton/shared/lib/api/payments';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/interfaces';

import type { ModelState } from '../interface';

const name = 'plans';

export interface PlansState {
    [name]: ModelState<{ plans: Plan[]; freePlan: FreePlanDefault }> & { meta: { fetchedAt: number } };
}

type SliceState = PlansState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectPlans = (state: PlansState) => state.plans;

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: { fetchedAt: -1 },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<Model>) => {
            state.value = action.payload;
            state.error = undefined;
            state.meta = { fetchedAt: Date.now() };
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.value = undefined;
            state.meta = { fetchedAt: Date.now() };
        },
    },
});

const promiseCache = createPromiseCache<Model>();

const thunk = (): ThunkAction<Promise<Model>, PlansState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const value = selectPlans(getState())?.value;
            if (value) {
                return Promise.resolve(value);
            }
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());
                const plans = extraArgument.api<{ Plans: Plan[] }>(queryPlans()).then(({ Plans }) => {
                    return Plans;
                });
                const freePlan = getFreePlan({
                    api: extraArgument.api,
                });
                const value = {
                    plans: await plans,
                    freePlan: await freePlan,
                };
                dispatch(slice.actions.fulfilled(value));
                return value;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };
        return promiseCache(select, cb);
    };
};

export const plansReducer = { [name]: slice.reducer };
export const plansThunk = thunk;
