import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { getInitialModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getMeetingQuery, getUpcomingMeetingsQuery } from '@proton/shared/lib/api/meet';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import type { UpdateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import { updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import type { Api } from '@proton/shared/lib/interfaces';
import type { MeetEventResponse, Meeting } from '@proton/shared/lib/interfaces/Meet';

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
            .api<{ Meetings: Meeting[] }>(getUpcomingMeetingsQuery)
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
    reducers: {
        removeMeeting: (state, action: { payload: string }) => {
            if (state.value) {
                state.value = state.value.filter((meeting) => meeting.ID !== action.payload);
            }
        },
        updateMeeting: (state, action: { payload: Meeting }) => {
            if (state.value) {
                const index = state.value.findIndex((meeting) => meeting.ID === action.payload.ID);
                if (index !== -1) {
                    state.value[index] = action.payload;
                }
            }
        },
        addMeeting: (state, action: { payload: Meeting }) => {
            if (state.value) {
                state.value.push(action.payload);
            } else {
                state.value = [action.payload];
            }
        },
        eventLoop: (state, action: PayloadAction<UpdateCollectionV6<Meeting>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

const queryMeeting = async (api: Api, id: string) => {
    const { Meeting } = await api<{ Meeting: Meeting }>(getMeetingQuery(id));
    return Meeting;
};

export const { removeMeeting, updateMeeting, addMeeting, eventLoop } = slice.actions;

export const meetingsReducer = { [name]: slice.reducer };
export const meetingsThunk = modelThunk.thunk;
export const meetingsEventLoopThunk = ({
    event,
    api,
}: {
    event: MeetEventResponse;
    api: Api;
}): ThunkAction<Promise<void>, MeetingsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.MeetMeetings,
            get: (ID) => queryMeeting(api, ID),
            refetch: () => dispatch(meetingsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(eventLoop(result)),
        });
    };
};
