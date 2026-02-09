import { createContext, useContext } from 'react';

import type { TrackReference } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import type { KeyRotationLog, MLSGroupState, ParticipantEntity } from '../types';

export interface MeetContextValues {
    expirationTime: number | null;
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    paidUser: boolean;
    roomName: string;
    resolution: string | null;
    setResolution: (resolution: string | null) => void;
    meetingLink: string;
    handleLeave: () => void;
    handleUngracefulLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    displayName: string;
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
    isGuestAdmin: boolean;
}

export const MeetContext = createContext<MeetContextValues>({
    expirationTime: null as number | null,
    locked: false,
    maxDuration: 0,
    maxParticipants: 0,
    paidUser: false,
    roomName: '',
    resolution: null,
    setResolution: () => {},
    meetingLink: '',
    handleLeave: () => {},
    handleUngracefulLeave: () => {},
    handleEndMeeting: async () => {},
    participantsMap: {},
    participantNameMap: {},
    getParticipants: () => Promise.resolve(),
    displayName: '',
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
    isGuestAdmin: false,
});

export const useMeetContext = () => {
    return useContext(MeetContext);
};
