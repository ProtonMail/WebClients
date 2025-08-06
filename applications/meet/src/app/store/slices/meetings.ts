import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import type { Meeting } from '@proton/meet';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

const name = 'meet_meetings' as const;

export interface MeetingsState {
    [name]: ModelState<Meeting[]>;
}

type SliceState = MeetingsState[typeof name];
type Model = NonNullable<SliceState['value']>;

const getMeetings = {
    method: 'get',
    url: `meet/v1/meetings/active`,
    silence: true,
};

export const selectMeetings = (state: MeetingsState) => {
    return state[name];
};

const modelThunk = createAsyncModelThunk<Model, MeetingsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) =>
        extraArgument
            .api<{ Meetings: Meeting[] }>(getMeetings)
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
