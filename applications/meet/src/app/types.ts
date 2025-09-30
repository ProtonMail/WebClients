import type { ChatMessage } from '@proton-meet/livekit-client';

export interface ParticipantSettings {
    displayName: string;
    audioDeviceId: string | null;
    audioOutputDeviceId: string | null;
    videoDeviceId: string | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
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
