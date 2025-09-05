import { createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getActiveMeetingsQuery } from '@proton/shared/lib/api/meet';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

const name = 'meet_meetings' as const;

export interface MeetingsState {
    [name]: ModelState<Meeting[]>;
}

type SliceState = MeetingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMeetings = (state: MeetingsState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, MeetingsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) =>
        extraArgument
            .api<{ Meetings: Meeting[] }>(getActiveMeetingsQuery)
            .then(({ Meetings }) => Meetings)
            .catch((err) => {
                throw err;
            }),
    previous: previousSelector(selectMeetings),
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

export const meetingsReducer = { [name]: slice.reducer };
export const meetingsThunk = modelThunk.thunk;
