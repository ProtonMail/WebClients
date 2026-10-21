import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

import type { UpsellModalTypes } from '../../types/types';
import type { MeetState } from '../store';
import { selectMeetingName } from './currentMeeting';

export interface MeetingEndedReason {
    // Not narrowed to `MeetingEndedReasons`: the server may send values this client does not know yet
    reason: string;
    // Captured on receipt, since participants are reset once the meeting is left
    isLocalParticipantHost: boolean;
}

interface MeetAppState {
    previousMeetingLink: string | null;
    previousMeetingName: string;
    upsellModalType: UpsellModalTypes | null;
    invalidMeetingLinkModalOpen: boolean;
    // Raw reason sent by the server on the `room_deleted` topic just before it deletes the room
    meetingEndedReason: MeetingEndedReason | null;
}

const initialState: MeetAppState = {
    previousMeetingLink: null,
    previousMeetingName: '',
    upsellModalType: null,
    invalidMeetingLinkModalOpen: false,
    meetingEndedReason: null,
};

const slice = createSlice({
    name: 'meetAppState',
    initialState,
    reducers: {
        setPreviousMeeting: (state, action: PayloadAction<{ link: string | null; name: string }>) => {
            state.previousMeetingLink = action.payload.link;
            state.previousMeetingName = action.payload.name;
        },
        setUpsellModalType: (state, action: PayloadAction<UpsellModalTypes | null>) => {
            state.upsellModalType = action.payload;
        },
        setInvalidMeetingLinkModalOpen: (state, action: PayloadAction<boolean>) => {
            state.invalidMeetingLinkModalOpen = action.payload;
        },
        setMeetingEndedReason: (state, action: PayloadAction<MeetingEndedReason | null>) => {
            state.meetingEndedReason = action.payload;
        },
    },
});

export const { setPreviousMeeting, setUpsellModalType, setInvalidMeetingLinkModalOpen, setMeetingEndedReason } =
    slice.actions;

export const savePreviousMeeting =
    (link: string | null): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch, getState) => {
        dispatch(setPreviousMeeting({ link, name: selectMeetingName(getState()) }));
    };

export const selectPreviousMeetingLink = (state: MeetState) => {
    return state.meetAppState.previousMeetingLink;
};

export const selectPreviousMeetingName = (state: MeetState) => {
    return state.meetAppState.previousMeetingName;
};

export const selectUpsellModalType = (state: MeetState) => {
    return state.meetAppState.upsellModalType;
};

export const selectInvalidMeetingLinkModalOpen = (state: MeetState) => {
    return state.meetAppState.invalidMeetingLinkModalOpen;
};

export const selectMeetingEndedReason = (state: MeetState) => {
    return state.meetAppState.meetingEndedReason;
};

export const meetAppStateReducer = { meetAppState: slice.reducer };
