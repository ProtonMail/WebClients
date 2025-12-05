import type { ChatMessage } from 'livekit-client';

export enum LoadingState {
    JoiningInProgress = 'JoiningInProgress',
    WaitingRoom = 'WaitingRoom',
}

export interface MeetChatMessage extends Pick<ChatMessage, 'id' | 'message' | 'timestamp'> {
    identity: string;
    name: string;
    seen?: boolean;
    type?: 'message';
}

export enum ParticipantEvent {
    Join = 'join',
    Leave = 'leave',
}

export interface ParticipantEventRecord {
    identity: string;
    name: string;
    eventType: ParticipantEvent;
    timestamp: number;
    type?: 'event';
}

export type MeetingRoomUpdate = ParticipantEventRecord | MeetChatMessage;

export enum MeetingSideBars {
    Participants = 'Participants',
    AssignHost = 'AssignHost',
    Settings = 'Settings',
    Chat = 'Chat',
    MeetingDetails = 'MeetingDetails',
}

export enum PopUpControls {
    Microphone = 'Microphone',
    Camera = 'Camera',
}

export enum QualityScenarios {
    ScreenShare = 'ScreenShare',
    PortraitView = 'PortraitView',
    MediumView = 'MediumView',
    SmallView = 'SmallView',
}

export enum ParticipantCapabilityPermission {
    NotAllowed = 0,
    Allowed = 1,
}

export interface ParticipantEntity {
    ParticipantUUID: string;
    DisplayName: string;
    CanSubscribe?: ParticipantCapabilityPermission;
    CanPublish?: ParticipantCapabilityPermission;
    CanPublishData?: ParticipantCapabilityPermission;
    IsAdmin?: ParticipantCapabilityPermission;
    IsHost?: ParticipantCapabilityPermission;
}

export interface MeetingDetails {
    meetingId: string;
    meetingName: string;
    date: string;
    time: string;
    meetingLink: string;
    duration: string;
}

export enum PermissionPromptStatus {
    CAMERA = 'CAMERA',
    MICROPHONE = 'MICROPHONE',
    CLOSED = 'CLOSED',
}

export type MLSGroupState = {
    displayCode: string | null;
    epoch: bigint;
};
export type SwitchActiveDevice = (params: {
    deviceType: 'audioinput' | 'audiooutput' | 'videoinput';
    deviceId: string;
    isSystemDefaultDevice: boolean;
    preserveDefaultDevice?: boolean;
}) => Promise<void>;

export interface DeviceState {
    systemDefault: MediaDeviceInfo | null;
    systemDefaultLabel: string;
    useSystemDefault: boolean;
    preferredAvailable: boolean;
    preferredDevice: MediaDeviceInfo | null;
}

export enum UpsellModalTypes {
    Schedule = 'schedule',
    PersonalMeeting = 'personalMeeting',
    StartMeeting = 'startMeeting',
    FreeAccount = 'freeAccount',
    PaidAccount = 'paidAccount',
}

export interface KeyRotationLog {
    timestamp: number;
    epoch: number;
    type: 'log' | 'error';
    message: string;
}

export enum RecordingStatus {
    Started = 'started',
    Stopped = 'stopped',
}

export enum PublishableDataTypes {
    RecordingStatus = 'recordingStatus',
    Message = 'message',
}

export interface DecryptionErrorLog {
    keyIndex: number;
    participantIdentity: string;
    receiverIdentity: string;
    tracksOfSender: {
        microphone: number;
        camera: number;
        screenShareVideo: number;
        screenShareAudio: number;
    };
}
