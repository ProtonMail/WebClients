import { createContext, useContext } from 'react';

import { VideoQuality } from '@proton-meet/livekit-client';
import type { LocalParticipant, Participant, RemoteParticipant } from '@proton-meet/livekit-client';

import { PAGE_SIZE } from '../constants';
import type { MeetChatMessage, ParticipantEntity, ParticipantEventRecord } from '../types';

export interface MeetContextValues {
    page: number;
    quality: VideoQuality;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setQuality: (quality: VideoQuality) => void;
    audioDeviceId: string | null;
    audioOutputDeviceId: string | null;
    videoDeviceId: string | null;
    setAudioDeviceId: (deviceId: string | null, save?: boolean) => void;
    setAudioOutputDeviceId: (deviceId: string | null, save?: boolean) => void;
    setVideoDeviceId: (deviceId: string | null, save?: boolean) => void;
    roomName: string;
    resolution: string | null;
    setResolution: (resolution: string | null) => void;
    meetingLink: string;
    chatMessages: MeetChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<MeetChatMessage[]>>;
    participantEvents: ParticipantEventRecord[];
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    isVideoEnabled: boolean;
    setIsVideoEnabled: (isVideoEnabled: boolean) => void;
    handleRotateCamera: () => void;
    isAudioEnabled: boolean;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    disableVideos: boolean;
    setDisableVideos: (disableVideos: boolean) => void;
    participantsWithDisabledVideos: string[];
    setParticipantsWithDisabledVideos: (participantsWithDisabledVideos: string[]) => void;
    displayName: string;
    sortedParticipants: (RemoteParticipant | LocalParticipant)[];
    pagedParticipants: (RemoteParticipant | LocalParticipant)[];
    pageCount: number;
    passphrase: string;
    guestMode: boolean;
    startScreenShare: () => void;
    stopScreenShare: () => void;
    isLocalScreenShare: boolean;
    isScreenShare: boolean;
    screenShareParticipant: Participant | null;
    toggleVideo: ({
        isEnabled,
        videoDeviceId,
        forceUpdate,
    }: {
        isEnabled: boolean;
        videoDeviceId: string;
        forceUpdate?: boolean;
    }) => Promise<void>;
    toggleAudio: ({ isEnabled, audioDeviceId }: { isEnabled: boolean; audioDeviceId: string | null }) => Promise<void>;
    backgroundBlur: boolean;
    toggleBackgroundBlur: ({
        isEnabled,
        videoDeviceId,
    }: {
        isEnabled: boolean;
        videoDeviceId: string;
    }) => Promise<void>;
    noiseFilter: boolean;
    toggleNoiseFilter: ({ isEnabled, audioDeviceId }: { isEnabled: boolean; audioDeviceId: string }) => Promise<void>;
    handleMeetingLockToggle: (enable: boolean) => Promise<void>;
    isMeetingLocked: boolean;
}

export const MeetContext = createContext<MeetContextValues>({
    page: 0,
    quality: VideoQuality.HIGH,
    setPage: () => {},
    setQuality: () => {},
    audioDeviceId: '',
    audioOutputDeviceId: '',
    videoDeviceId: '',
    setAudioDeviceId: () => {},
    setAudioOutputDeviceId: () => {},
    setVideoDeviceId: () => {},
    roomName: '',
    resolution: null,
    setResolution: () => {},
    meetingLink: '',
    chatMessages: [],
    setChatMessages: () => {},
    participantEvents: [],
    pageSize: PAGE_SIZE,
    setPageSize: () => {},
    handleLeave: () => {},
    handleEndMeeting: async () => {},
    isVideoEnabled: false,
    setIsVideoEnabled: () => {},
    handleRotateCamera: () => {},
    isAudioEnabled: false,
    participantsMap: {},
    participantNameMap: {},
    getParticipants: () => Promise.resolve(),
    disableVideos: false,
    setDisableVideos: () => {},
    participantsWithDisabledVideos: [],
    setParticipantsWithDisabledVideos: () => {},
    displayName: '',
    sortedParticipants: [],
    pagedParticipants: [],
    pageCount: 0,
    passphrase: '',
    guestMode: false,
    startScreenShare: () => {},
    stopScreenShare: () => {},
    isLocalScreenShare: false,
    isScreenShare: false,
    screenShareParticipant: null,
    toggleVideo: () => Promise.resolve(),
    toggleAudio: () => Promise.resolve(),
    backgroundBlur: false,
    toggleBackgroundBlur: () => Promise.resolve(),
    noiseFilter: false,
    toggleNoiseFilter: () => Promise.resolve(),
    handleMeetingLockToggle: () => Promise.resolve(),
    isMeetingLocked: false,
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
