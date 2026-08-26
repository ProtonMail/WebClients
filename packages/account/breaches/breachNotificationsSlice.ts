import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { createHooks } from '@proton/redux-utilities/hooks';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { getUnreadBreachesCount } from '@proton/shared/lib/api/breaches';
import type { Api, BreachesCount } from '@proton/shared/lib/interfaces';

import { serverEvent } from '../eventLoop';

const name = 'breachesCount';

const fetchUnreadBreachCount = (api: Api) =>
    api(getUnreadBreachesCount()).then(({ Count }: BreachesCount) => {
        return { Count, Refresh: true };
    });

interface UserBreachesState {
    [name]: ModelState<BreachesCount>;
}

type SliceState = UserBreachesState[typeof name];
type Model = NonNullable<SliceState['value']>;

// selectors
const selectBreachesCount = (state: UserBreachesState) => state[name];
export const selectShouldBreachAlertsRefresh = (state: UserBreachesState) => state[name].value?.Refresh;
export const selectUnreadBreachesCount = (state: UserBreachesState) => state[name].value?.Count;

const modelThunk = createAsyncModelThunk<Model, UserBreachesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return fetchUnreadBreachCount(extraArgument.api);
    },
    previous: previousSelector(selectBreachesCount),
});

const initialState = getInitialModelState<Model>();

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
const breachesCountThunk = modelThunk.thunk;

const hooks = createHooks(breachesCountThunk, selectBreachesCount);
export const useGetBreachesCounts = hooks.useGet;
