import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { UpsellModalTypes } from '../../types/types';
import type { MeetState } from '../store';

export interface MeetAppState {
    previousMeetingLink: string | null;
    upsellModalType: UpsellModalTypes | null;
}

const initialState: MeetAppState = {
    previousMeetingLink: null,
    upsellModalType: null,
};

const slice = createSlice({
    name: 'meetAppState',
    initialState,
    reducers: {
        setPreviousMeetingLink: (state, action: PayloadAction<string | null>) => {
            state.previousMeetingLink = action.payload;
        },
        setUpsellModalType: (state, action: PayloadAction<UpsellModalTypes | null>) => {
            state.upsellModalType = action.payload;
        },
    },
});

export const { setPreviousMeetingLink, setUpsellModalType } = slice.actions;

export const selectPreviousMeetingLink = (state: MeetState) => {
    return state.meetAppState.previousMeetingLink;
};

export const selectUpsellModalType = (state: MeetState) => {
    return state.meetAppState.upsellModalType;
};

export const meetAppStateReducer = { meetAppState: slice.reducer };
