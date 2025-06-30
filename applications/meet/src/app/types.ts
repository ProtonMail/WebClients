import type { ChatMessage } from 'livekit-client';

export interface ParticipantSettings {
    displayName: string;
    audioDeviceId: string | null;
    videoDeviceId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isFaceTrackingEnabled: boolean;
}

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
    LargeGrid = 'LargeGrid',
    Default = 'Default',
}

export enum Quality {
    Decreased = 'Decreased',
    Default = 'Default',
    Increased = 'Increased',
}

export enum ParticipantCapabilityPermission {
    NotAllowed = 0,
    Allowed = 1,
}

export interface ParticipantEntity {
    ParticipantUuid: string;
    DisplayName: string;
    CanSubscribe: ParticipantCapabilityPermission;
    CanPublish: ParticipantCapabilityPermission;
    CanPublishData: ParticipantCapabilityPermission;
    IsAdmin: ParticipantCapabilityPermission;
    IsHost: ParticipantCapabilityPermission;
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
