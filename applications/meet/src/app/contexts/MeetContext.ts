import { createContext, useContext } from 'react';

export interface MeetContextValues {
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    startScreenShare: () => void;
    stopScreenShare: () => void;
    handleMeetingLockToggle: () => Promise<void>;
    assignHost: (participantUuid: string) => Promise<void>;
    getKeychainIndexInformation: () => (number | undefined)[];
}

export const MeetContext = createContext<MeetContextValues>({
    handleLeave: () => {},
    handleEndMeeting: async () => {},
    startScreenShare: () => {},
    stopScreenShare: () => {},
    handleMeetingLockToggle: () => Promise.resolve(),
    assignHost: () => Promise.resolve(),
    getKeychainIndexInformation: () => [],
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
