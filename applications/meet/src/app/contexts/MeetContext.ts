import { createContext, useContext } from 'react';

import { VideoQuality } from '@proton-meet/livekit-client';
import type { LocalParticipant, RemoteParticipant } from '@proton-meet/livekit-client';

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
    setAudioDeviceId: (deviceId: string | null) => void;
    setAudioOutputDeviceId: (deviceId: string | null) => void;
    setVideoDeviceId: (deviceId: string | null) => void;
    roomName: string;
    resolution: string | null;
    setResolution: (resolution: string | null) => void;
    meetingLink: string;
    chatMessages: MeetChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<MeetChatMessage[]>>;
    participantEvents: ParticipantEventRecord[];
    setParticipantEvents: React.Dispatch<React.SetStateAction<ParticipantEventRecord[]>>;
    pageSize: number;
    setPageSize: (pageSize: number) => void;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    isVideoEnabled: boolean;
    setIsVideoEnabled: (isVideoEnabled: boolean) => void;
    isAudioEnabled: boolean;
    isFaceTrackingEnabled: boolean;
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
    setParticipantEvents: () => {},
    pageSize: PAGE_SIZE,
    setPageSize: () => {},
    handleLeave: () => {},
    handleEndMeeting: async () => {},
    isVideoEnabled: false,
    setIsVideoEnabled: () => {},
    isAudioEnabled: false,
    isFaceTrackingEnabled: false,
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
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
