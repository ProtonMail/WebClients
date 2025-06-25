import { createContext, useContext } from 'react';

import { VideoQuality } from 'livekit-client';

import { PAGE_SIZE } from '../constants';
import type { MeetChatMessage, ParticipantEventRecord } from '../types';
import { PopUpControls } from '../types';
import { MeetingSideBars } from '../types';

export interface MeetContextValues {
    page: number;
    quality: VideoQuality;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setQuality: (quality: VideoQuality) => void;
    audioDeviceId: string;
    videoDeviceId: string;
    setAudioDeviceId: (deviceId: string) => void;
    setVideoDeviceId: (deviceId: string) => void;
    roomName: string;
    resolution: string | null;
    setResolution: (resolution: string | null) => void;
    meetingLink: string;
    sideBarState: Record<MeetingSideBars, boolean>;
    toggleSideBarState: (sidebar: MeetingSideBars) => void;
    popupState: Record<PopUpControls, boolean>;
    togglePopupState: (popup: PopUpControls) => void;
    chatMessages: MeetChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<MeetChatMessage[]>>;
    participantEvents: ParticipantEventRecord[];
    setParticipantEvents: React.Dispatch<React.SetStateAction<ParticipantEventRecord[]>>;
    selfView: boolean;
    setSelfView: (selfView: boolean) => void;
    shouldShowConnectionIndicator: boolean;
    setShouldShowConnectionIndicator: (shouldShowConnectionIndicator: boolean) => void;
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    handleLeave: () => void;
    isVideoEnabled: boolean;
    setIsVideoEnabled: (isVideoEnabled: boolean) => void;
    isAudioEnabled: boolean;
    isFaceTrackingEnabled: boolean;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
}

export const MeetContext = createContext<MeetContextValues>({
    page: 0,
    quality: VideoQuality.HIGH,
    setPage: () => {},
    setQuality: () => {},
    audioDeviceId: '',
    videoDeviceId: '',
    setAudioDeviceId: () => {},
    setVideoDeviceId: () => {},
    roomName: '',
    resolution: null,
    setResolution: () => {},
    meetingLink: '',
    sideBarState: {
        [MeetingSideBars.Participants]: false,
        [MeetingSideBars.Settings]: false,
        [MeetingSideBars.Chat]: false,
        [MeetingSideBars.MeetingDetails]: false,
    },
    toggleSideBarState: () => {},
    popupState: {
        [PopUpControls.Microphone]: false,
        [PopUpControls.Camera]: false,
    },
    togglePopupState: () => {},
    chatMessages: [],
    setChatMessages: () => {},
    participantEvents: [],
    setParticipantEvents: () => {},
    selfView: true,
    setSelfView: () => {},
    shouldShowConnectionIndicator: false,
    setShouldShowConnectionIndicator: () => {},
    pageSize: PAGE_SIZE,
    setPageSize: () => {},
    handleLeave: () => {},
    isVideoEnabled: false,
    setIsVideoEnabled: () => {},
    isAudioEnabled: false,
    isFaceTrackingEnabled: false,
    participantNameMap: {},
    getParticipants: () => Promise.resolve(),
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
