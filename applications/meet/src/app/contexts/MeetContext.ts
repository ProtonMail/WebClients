import { createContext, useContext } from 'react';

import { VideoQuality } from 'livekit-client';

interface MeetContextValues {
    page: number;
    quality: VideoQuality;
    setPage: (nextPage: (currentPage: number) => number) => void;
    setQuality: (quality: VideoQuality) => void;
    isParticipantsOpen: boolean;
    setIsParticipantsOpen: (isParticipantsOpen: boolean) => void;
    audioDeviceId: string;
    videoDeviceId: string;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
    roomName: string;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isSettingsOpen: boolean) => void;
    resolution: string | null;
    setResolution: (resolution: string | null) => void;
}

export const MeetContext = createContext<MeetContextValues>({
    page: 0,
    quality: VideoQuality.HIGH,
    setPage: () => {},
    setQuality: () => {},
    isParticipantsOpen: false,
    setIsParticipantsOpen: () => {},
    audioDeviceId: '',
    videoDeviceId: '',
    setAudioDeviceId: () => {},
    setVideoDeviceId: () => {},
    roomName: '',
    isSettingsOpen: false,
    setIsSettingsOpen: () => {},
    resolution: null,
    setResolution: () => {},
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
