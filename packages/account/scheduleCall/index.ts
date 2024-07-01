import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { scheduleCall } from '@proton/shared/lib/api/support';
import type { ScheduleCall } from '@proton/shared/lib/interfaces';

import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';

const name = 'scheduleCall' as const;

export interface ScheduleCallState {
    [name]: ModelState<ScheduleCall>;
}

type SliceState = ScheduleCallState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectScheduleCall = (state: ScheduleCallState) => state[name];

const modelThunk = createAsyncModelThunk<Model, ScheduleCallState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument.api(scheduleCall());
    },
    previous: previousSelector(selectScheduleCall),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const scheduleCallReducer = { [name]: slice.reducer };
export const scheduleCallThunk = modelThunk.thunk;
