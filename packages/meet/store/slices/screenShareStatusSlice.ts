import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

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
    },
});

export const selectIsLocalScreenShare = (state: MeetState) =>
    state.screenShareStatus.participantScreenSharingIdentity !== null &&
    state.screenShareStatus.participantScreenSharingIdentity === state.sortedParticipants.localParticipantIdentity;
export const selectIsScreenShare = (state: MeetState) => !!state.screenShareStatus.participantScreenSharingIdentity;
export const selectIsParticipantScreenSharing = (meetState: MeetState, participantIdentity: string) =>
    meetState.screenShareStatus.participantScreenSharingIdentity === participantIdentity;

export const { setParticipantScreenShare } = slice.actions;

export const screenShareStatusReducer = { screenShareStatus: slice.reducer };
