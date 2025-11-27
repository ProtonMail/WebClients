import { createContext, useContext } from 'react';

import type { TrackReference } from '@livekit/components-react';
import { VideoQuality } from 'livekit-client';
import type { LocalParticipant, Participant, RemoteParticipant } from 'livekit-client';

import { PAGE_SIZE } from '../constants';
import type { MLSGroupState, MeetChatMessage, ParticipantEntity, ParticipantEventRecord } from '../types';

export interface MeetContextValues {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    paidUser: boolean;
    page: number;
    quality: VideoQuality;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setQuality: (quality: VideoQuality) => void;
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
    pagedParticipantsWithoutSelfView: (RemoteParticipant | LocalParticipant)[];
    pageCountWithoutSelfView: number;
    passphrase: string;
    guestMode: boolean;
    mlsGroupState: MLSGroupState | null;
    startScreenShare: () => void;
    stopScreenShare: () => void;
    isLocalScreenShare: boolean;
    isScreenShare: boolean;
    screenShareParticipant: Participant | null;
    screenShareTrack: TrackReference | null;
    handleMeetingLockToggle: (enable: boolean) => Promise<void>;
    isMeetingLocked: boolean;
    isDisconnected: boolean;
    startPiP: () => void;
    stopPiP: () => void;
    preparePictureInPicture: () => void;
    instantMeeting: boolean;
    assignHost: (participantUuid: string) => Promise<void>;
}

export const MeetContext = createContext<MeetContextValues>({
    locked: false,
    maxDuration: 0,
    maxParticipants: 0,
    paidUser: false,
    page: 0,
    quality: VideoQuality.HIGH,
    setPage: () => {},
    setQuality: () => {},
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
    pagedParticipantsWithoutSelfView: [],
    pageCountWithoutSelfView: 0,
    passphrase: '',
    guestMode: false,
    mlsGroupState: null,
    startScreenShare: () => {},
    stopScreenShare: () => {},
    isLocalScreenShare: false,
    isScreenShare: false,
    screenShareParticipant: null,
    screenShareTrack: null,
    handleMeetingLockToggle: () => Promise.resolve(),
    isMeetingLocked: false,
    isDisconnected: false,
    startPiP: () => {},
    stopPiP: () => {},
    preparePictureInPicture: () => {},
    instantMeeting: false,
    assignHost: () => Promise.resolve(),
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
