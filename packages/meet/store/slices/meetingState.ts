import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { PAGE_SIZE } from '../../constants';
import type { MeetChatMessage, ParticipantEventRecord } from '../../types/types';
import type { MeetState } from '../rootReducer';

export interface MeetingState {
    page: number;
    pageSize: number;
    chatMessages: MeetChatMessage[];
    events: ParticipantEventRecord[];
}

const initialState: MeetingState = {
    page: 0,
    pageSize: PAGE_SIZE,
    chatMessages: [],
    events: [],
};

const slice = createSlice({
    name: 'meetingState',
    initialState,
    reducers: {
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
        },
        addChatMessages: (state, action: PayloadAction<MeetChatMessage[]>) => {
            state.chatMessages = [...state.chatMessages, ...action.payload];
        },
        markChatMessagesAsSeen: (state) => {
            state.chatMessages = state.chatMessages.map((message) => ({ ...message, seen: true }));
        },
        addEvent: (state, action: PayloadAction<ParticipantEventRecord[]>) => {
            state.events = [...state.events, ...action.payload];
        },
        resetMeetingState: (state) => {
            state.page = initialState.page;
            state.pageSize = initialState.pageSize;
            state.chatMessages = initialState.chatMessages;
            state.events = initialState.events;
        },
    },
});

export const { setPage, setPageSize, addChatMessages, addEvent, resetMeetingState, markChatMessagesAsSeen } =
    slice.actions;

export const selectPage = (state: MeetState) => {
    return state.meetingState.page;
};

export const selectPageSize = (state: MeetState) => {
    return state.meetingState.pageSize;
};

export const selectChatMessages = (state: MeetState) => {
    return state.meetingState.chatMessages;
};

export const selectEvents = (state: MeetState) => {
    return state.meetingState.events;
};

export const meetingStateReducer = { meetingState: slice.reducer };
