import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import { useMeetingRecorder as useMeetingRecorderLegacy } from '../hooks/useMeetingRecorder/useMeetingRecorder';
import { useMeetingRecorder as useMeetingRecorderRefactored } from '../hooks/useMeetingRecorderNew';

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

// Each implementation lives in its own component so only one set of hooks is
// mounted at a time. Switching the FF unmounts one tree and mounts the other,
// avoiding any duplicate AudioContexts, workers or codec probes.
const LegacyMeetingRecorderProvider = ({ children }: { children: ReactNode }) => {
    const { startRecording, downloadRecording } = useMeetingRecorderLegacy();
    const value = useMemo(() => ({ startRecording, downloadRecording }), [startRecording, downloadRecording]);
    return <MeetingRecorderContext.Provider value={value}>{children}</MeetingRecorderContext.Provider>;
};

const RefactoredMeetingRecorderProvider = ({ children }: { children: ReactNode }) => {
    const { startRecording, downloadRecording } = useMeetingRecorderRefactored();
    const value = useMemo(() => ({ startRecording, downloadRecording }), [startRecording, downloadRecording]);
    return <MeetingRecorderContext.Provider value={value}>{children}</MeetingRecorderContext.Provider>;
};

export const MeetingRecorderProvider = ({ children }: { children: ReactNode }) => {
    const isRefactorEnabled = useFlag('MeetingRecorderRefactor');

    if (isRefactorEnabled) {
        return <RefactoredMeetingRecorderProvider>{children}</RefactoredMeetingRecorderProvider>;
    }

    return <LegacyMeetingRecorderProvider>{children}</LegacyMeetingRecorderProvider>;
};
