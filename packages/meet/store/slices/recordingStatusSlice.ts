import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from '../rootReducer';
import { selectParticipantDecryptedNameMap } from './meetingInfo';
import { selectLocalParticipantIdentity } from './sortedParticipantsSlice';

export interface RecordingStatusState {
    localRecordingTime: number;
    localRecordingTimer: number | null;
    participantsRecording: string[];
}

export const initialState: RecordingStatusState = {
    localRecordingTime: 0,
    localRecordingTimer: null,
    participantsRecording: [],
};

const slice = createSlice({
    name: 'recordingStatus',
    initialState,
    reducers: {
        // Participants recording
        addParticipantRecording: (state, action: PayloadAction<string>) => {
            state.participantsRecording = [...state.participantsRecording, action.payload];
        },
        removeParticipantRecording: (state, action: PayloadAction<string>) => {
            state.participantsRecording = state.participantsRecording.filter((id) => id !== action.payload);
        },

        // Local recording timer
        increaseLocalRecordingTime: (state) => {
            state.localRecordingTime += 1;
        },
        resetLocalRecordingTime: (state) => {
            state.localRecordingTime = 0;
        },
        setLocalRecordingTimer: (state, action: PayloadAction<number | null>) => {
            state.localRecordingTimer = action.payload;
        },
    },
});

export const startLocalRecordingTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { localRecordingTimer } = getState().recordingStatus;

        // Defensivley stop previous timer
        if (localRecordingTimer) {
            clearInterval(localRecordingTimer);
        }

        const timer = window.setInterval(() => {
            dispatch(slice.actions.increaseLocalRecordingTime());
        }, 1000);

        dispatch(slice.actions.resetLocalRecordingTime());
        dispatch(slice.actions.setLocalRecordingTimer(timer));
    };

export const stopLocalRecordingTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { localRecordingTimer } = getState().recordingStatus;

        if (localRecordingTimer) {
            clearInterval(localRecordingTimer);
        }

        dispatch(slice.actions.setLocalRecordingTimer(null));
        dispatch(slice.actions.resetLocalRecordingTime());
    };

export const selectParticipantsRecording = (state: MeetState) => state.recordingStatus.participantsRecording;

export const selectIsRecordingInProgress = (state: MeetState) => state.recordingStatus.participantsRecording.length > 0;

export const selectIsParticipantRecording = (state: MeetState, identity: string) =>
    state.recordingStatus.participantsRecording.includes(identity);

export const selectIsLocalParticipantRecording = createSelector(
    [selectLocalParticipantIdentity, selectParticipantsRecording],
    (localIdentity, participantsRecording) => participantsRecording.includes(localIdentity)
);

export const selectLocalRecordingTime = (state: MeetState) => state.recordingStatus.localRecordingTime;

export const selectRecordingParticipantNames = createSelector(
    [selectParticipantDecryptedNameMap, selectParticipantsRecording],
    (participantDecryptedNameMap, participantsRecording) => {
        return participantsRecording.map((identity) => {
            return participantDecryptedNameMap[identity];
        });
    }
);

export const { addParticipantRecording, removeParticipantRecording } = slice.actions;

export const recordingStatusReducer = { recordingStatus: slice.reducer };
