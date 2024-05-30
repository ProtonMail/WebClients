import { createSlice } from '@reduxjs/toolkit';
import type { ModelState } from 'packages/account';

import { serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, createHooks, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getUnreadBreachesCount } from '@proton/shared/lib/api/breaches';
import { Api } from '@proton/shared/lib/interfaces';
import { BreachesCount } from '@proton/shared/lib/interfaces';

const name = 'breachesCount';

const fetchUnreadBreachCount = (api: Api) =>
    api(getUnreadBreachesCount()).then(({ Count }: BreachesCount) => {
        return { Count, Refresh: true };
    });

export interface UserBreachesState {
    [name]: ModelState<BreachesCount>;
}

type SliceState = UserBreachesState[typeof name];
type Model = NonNullable<SliceState['value']>;

// selectors
export const selectBreachesCount = (state: UserBreachesState) => state[name];
export const selectShouldBreachAlertsRefresh = (state: UserBreachesState) => state[name].value?.Refresh;
export const selectUnreadBreachesCount = (state: UserBreachesState) => state[name].value?.Count;

const modelThunk = createAsyncModelThunk<Model, UserBreachesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return fetchUnreadBreachCount(extraArgument.api);
    },
    previous: previousSelector(selectBreachesCount),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        decreaseUnreadBreachCount: (state) => {
            if (state.value && state.value.Count > 0) {
                state.value.Count -= 1;
            }
        },
        setUnreadBreachesCount: (state, action) => {
            if (state.value && action.payload) {
                state.value.Count = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.BreachAlerts) {
                state.value.Count += action.payload.BreachAlerts.length;
                state.value.Refresh = !state.value.Refresh;
            }
        });
    },
});

export const { decreaseUnreadBreachCount, setUnreadBreachesCount } = slice.actions;
export const breachesCountReducer = { [name]: slice.reducer };
export const breachesCountThunk = modelThunk.thunk;

const hooks = createHooks(breachesCountThunk, selectBreachesCount);
export const useBreachesCounts = hooks.useValue;
export const useGetBreachesCounts = hooks.useGet;
