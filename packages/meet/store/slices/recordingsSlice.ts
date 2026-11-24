import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

export interface OpfsRecording {
    name: string;
    extension: string;
    createdAt: number;
    size: number;
    folder?: string;
}

type RecordingDownloadStatus = 'processing' | 'ready' | 'error';

interface RecordingsState {
    status: RecordingDownloadStatus | null;
    recording: OpfsRecording | null;
    recordings: OpfsRecording[];
    savingRecordingKeys: string[];
}

const initialState: RecordingsState = {
    status: null,
    recording: null,
    recordings: [],
    savingRecordingKeys: [],
};

export const getRecordingKey = ({ folder, name }: OpfsRecording) => `${folder ?? 'root'}/${name}`;

const slice = createSlice({
    name: 'recordings',
    initialState,
    reducers: {
        recordingProcessing: (state) => {
            state.status = 'processing';
            state.recording = null;
        },
        recordingReady: (state, action: PayloadAction<OpfsRecording>) => {
            state.status = 'ready';
            state.recording = action.payload;
        },
        recordingFailed: (state) => {
            state.status = 'error';
        },
        clearRecording: (state) => {
            state.status = null;
            state.recording = null;
        },
        setRecordings: (state, action: PayloadAction<OpfsRecording[]>) => {
            state.recordings = action.payload;
        },
        recordingSaveStarted: (state, action: PayloadAction<string>) => {
            state.savingRecordingKeys.push(action.payload);
        },
        recordingSaveEnded: (state, action: PayloadAction<string>) => {
            const index = state.savingRecordingKeys.indexOf(action.payload);
            if (index !== -1) {
                state.savingRecordingKeys.splice(index, 1);
            }
        },
    },
});

export const selectRecordingStatus = (state: MeetState) => state.recordings.status;
export const selectRecording = (state: MeetState) => state.recordings.recording;
export const selectRecordings = (state: MeetState) => state.recordings.recordings;
export const selectSavingRecordingKeys = (state: MeetState) => state.recordings.savingRecordingKeys;

export const {
    recordingProcessing,
    recordingReady,
    recordingFailed,
    clearRecording,
    setRecordings,
    recordingSaveStarted,
    recordingSaveEnded,
} = slice.actions;

export const recordingsReducer = { recordings: slice.reducer };
