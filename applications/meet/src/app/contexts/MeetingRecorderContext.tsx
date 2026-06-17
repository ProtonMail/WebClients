import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { useMeetingRecorder } from '../hooks/useMeetingRecorder';

export interface MeetingRecorderContextType {
    startRecording: () => Promise<void>;
    downloadRecording: () => Promise<void>;
}

const defaultValues: MeetingRecorderContextType = {
    startRecording: () => Promise.resolve(),
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

export const MeetingRecorderProvider = ({ children }: { children: ReactNode }) => {
    const { startRecording, downloadRecording } = useMeetingRecorder();
    const value = useMemo(() => ({ startRecording, downloadRecording }), [startRecording, downloadRecording]);
    return <MeetingRecorderContext.Provider value={value}>{children}</MeetingRecorderContext.Provider>;
};
