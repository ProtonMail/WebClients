import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';
import { selectParticipantDecryptedNameMap } from './meetingInfo';
import { selectLocalParticipantIdentity } from './sortedParticipantsSlice';

export interface RecordingStatusState {
    participantsRecording: string[];
    /** @deprecated Remove 'isRecording' with MeetMultipleRecording ff cleanup */
    isRecording: boolean;
}

export const initialState: RecordingStatusState = {
    participantsRecording: [],
    isRecording: false,
};

const slice = createSlice({
    name: 'recordingStatus',
    initialState,
    reducers: {
        addParticipantRecording: (state, action: PayloadAction<string>) => {
            state.participantsRecording = [...state.participantsRecording, action.payload];
        },
        removeParticipantRecording: (state, action: PayloadAction<string>) => {
            state.participantsRecording = state.participantsRecording.filter((id) => id !== action.payload);
        },
        /** @deprecated Remove 'setIsRecording' with MeetMultipleRecording ff cleanup */
        setIsRecording: (state, action: PayloadAction<boolean>) => {
            state.isRecording = action.payload;
        },
    },
});

export const selectParticipantsRecording = (state: MeetState) => state.recordingStatus.participantsRecording;

/** Remove '|| state.recordingStatus.isRecording' with MeetMultipleRecording ff cleanup */
export const selectIsRecordingInProgress = (state: MeetState) =>
    state.recordingStatus.participantsRecording.length > 0 || state.recordingStatus.isRecording;

export const selectIsParticipantRecording = (state: MeetState, identity: string) =>
    state.recordingStatus.participantsRecording.includes(identity);

export const selectIsLocalParticipantRecording = createSelector(
    [selectLocalParticipantIdentity, selectParticipantsRecording],
    (localIdentity, participantsRecording) => participantsRecording.includes(localIdentity)
);

export const selectRecordingParticipantNames = createSelector(
    [selectParticipantDecryptedNameMap, selectParticipantsRecording],
    (participantDecryptedNameMap, participantsRecording) => {
        return participantsRecording.map((identity) => {
            return participantDecryptedNameMap[identity];
        });
    }
);

export const { addParticipantRecording, removeParticipantRecording, setIsRecording } = slice.actions;

export const recordingStatusReducer = { recordingStatus: slice.reducer };
