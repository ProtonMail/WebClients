import { createContext, useContext } from 'react';

import type { TrackReference } from '@livekit/components-react';
import type { LocalParticipant, Participant, RemoteParticipant } from 'livekit-client';

import { PAGE_SIZE } from '../constants';
import type {
    DecryptionErrorLog,
    KeyRotationLog,
    MLSGroupState,
    MeetChatMessage,
    ParticipantEntity,
    ParticipantEventRecord,
} from '../types';

export interface MeetContextValues {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    paidUser: boolean;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
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
    handleUngracefulLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
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
    handleMeetingLockToggle: () => Promise<void>;
    isDisconnected: boolean;
    startPiP: () => void;
    stopPiP: () => void;
    preparePictureInPicture: () => void;
    instantMeeting: boolean;
    assignHost: (participantUuid: string) => Promise<void>;
    keyRotationLogs: KeyRotationLog[];
    isRecordingInProgress: boolean;
    getKeychainIndexInformation: () => (number | undefined)[];
    decryptionErrorLogs: DecryptionErrorLog[];
    sortedParticipantsMap: Map<string, RemoteParticipant | LocalParticipant>;
}

export const MeetContext = createContext<MeetContextValues>({
    locked: false,
    maxDuration: 0,
    maxParticipants: 0,
    paidUser: false,
    page: 0,
    setPage: () => {},
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
    handleUngracefulLeave: () => {},
    handleEndMeeting: async () => {},
    participantsMap: {},
    participantNameMap: {},
    getParticipants: () => Promise.resolve(),
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
    isDisconnected: false,
    startPiP: () => {},
    stopPiP: () => {},
    preparePictureInPicture: () => {},
    instantMeeting: false,
    assignHost: () => Promise.resolve(),
    keyRotationLogs: [],
    isRecordingInProgress: false,
    getKeychainIndexInformation: () => [],
    decryptionErrorLogs: [],
    sortedParticipantsMap: new Map(),
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
