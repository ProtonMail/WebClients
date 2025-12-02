import { createContext, useContext } from 'react';

import type { MeetingRecordingState } from '../hooks/useMeetingRecorder/types';

export interface MeetingRecorderContextType {
    recordingState: MeetingRecordingState;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    downloadRecording: () => Promise<void>;
}

const defaultValues: MeetingRecorderContextType = {
    recordingState: {
        isRecording: false,
        recordedChunks: [],
    },
    startRecording: () => Promise.resolve(),
    stopRecording: () => Promise.resolve(null),
    downloadRecording: () => Promise.resolve(),
};

export const MeetingRecorderContext = createContext<MeetingRecorderContextType>(defaultValues);

export const useMeetingRecorderContext = () => {
    const context = useContext(MeetingRecorderContext);
    if (!context) {
        throw new Error('useMeetingRecorderContext must be used within a MeetingRecorderProvider');
    }
    return context;
};
