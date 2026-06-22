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

export type RecordingDownloadStatus = 'processing' | 'ready' | 'error';

export interface RecordingsState {
    status: RecordingDownloadStatus | null;
    recording: OpfsRecording | null;
    recordings: OpfsRecording[];
}

export const initialState: RecordingsState = {
    status: null,
    recording: null,
    recordings: [],
};

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
    },
});

export const selectRecordingStatus = (state: MeetState) => state.recordings.status;
export const selectRecording = (state: MeetState) => state.recordings.recording;
export const selectRecordings = (state: MeetState) => state.recordings.recordings;
export const selectHasRecordings = (state: MeetState) => state.recordings.recordings.length > 0;

export const { recordingProcessing, recordingReady, recordingFailed, clearRecording, setRecordings } = slice.actions;

export const recordingsReducer = { recordings: slice.reducer };
