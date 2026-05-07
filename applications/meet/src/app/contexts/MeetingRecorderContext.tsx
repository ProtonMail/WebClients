import { createContext, useContext } from 'react';

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
