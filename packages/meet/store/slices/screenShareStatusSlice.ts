import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';
import { selectParticipantName } from './participants/participantsSlice';

export interface ScreenShareStatusState {
    participantScreenSharingIdentity: string | null;
}

export const initialState: ScreenShareStatusState = {
    participantScreenSharingIdentity: null,
};

const slice = createSlice({
    name: 'screenShareStatus',
    initialState,
    reducers: {
        setParticipantScreenShare: (state, action: PayloadAction<string | null>) => {
            state.participantScreenSharingIdentity = action.payload;
        },
        resetScreenShareStatus: (state) => {
            state.participantScreenSharingIdentity = initialState.participantScreenSharingIdentity;
        },
    },
});

export const selectIsLocalScreenShare = (state: MeetState) =>
    state.screenShareStatus.participantScreenSharingIdentity !== null &&
    state.screenShareStatus.participantScreenSharingIdentity === state.participants.localParticipantIdentity;
export const selectIsScreenShare = (state: MeetState) => !!state.screenShareStatus.participantScreenSharingIdentity;
export const selectScreenSharingParticipantIdentity = (state: MeetState) =>
    state.screenShareStatus.participantScreenSharingIdentity;
export const selectIsParticipantScreenSharing = (meetState: MeetState, participantIdentity: string) =>
    meetState.screenShareStatus.participantScreenSharingIdentity === participantIdentity;
export const selectScreenSharingParticipantName = (state: MeetState) =>
    state.screenShareStatus.participantScreenSharingIdentity
        ? selectParticipantName(state, state.screenShareStatus.participantScreenSharingIdentity)
        : '';

export const { setParticipantScreenShare, resetScreenShareStatus } = slice.actions;

export const screenShareStatusReducer = { screenShareStatus: slice.reducer };
