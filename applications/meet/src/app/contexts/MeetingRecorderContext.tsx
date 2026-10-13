import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { useMeetingRecorder } from '../hooks/useMeetingRecorder';
import type { RecordingDiagnostics } from '../hooks/useMeetingRecorder/recordingSession/types';

interface MeetingRecorderContextType {
    startRecording: () => Promise<void>;
    finishRecording: () => Promise<void>;
    getRecordingDiagnostics: () => RecordingDiagnostics | null;
}

const defaultValues: MeetingRecorderContextType = {
    startRecording: () => Promise.resolve(),
    finishRecording: () => Promise.resolve(),
    getRecordingDiagnostics: () => null,
};

const MeetingRecorderContext = createContext<MeetingRecorderContextType>(defaultValues);

export const useMeetingRecorderContext = () => {
    const context = useContext(MeetingRecorderContext);
    if (!context) {
        throw new Error('useMeetingRecorderContext must be used within a MeetingRecorderProvider');
    }
    return context;
};

export const MeetingRecorderProvider = ({ children }: { children: ReactNode }) => {
    const { startRecording, finishRecording, getRecordingDiagnostics } = useMeetingRecorder();
    const value = useMemo(
        () => ({ startRecording, finishRecording, getRecordingDiagnostics }),
        [startRecording, finishRecording, getRecordingDiagnostics]
    );
    return <MeetingRecorderContext.Provider value={value}>{children}</MeetingRecorderContext.Provider>;
};
