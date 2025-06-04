import type { ChatMessage } from 'livekit-client';

export interface ParticipantSettings {
    displayName: string;
    audioDeviceId: string;
    videoDeviceId: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isFaceTrackingEnabled: boolean;
    roomName: string;
    meetingLink: string;
}

export enum LoadingState {
    JoiningInProgress = 'JoiningInProgress',
    WaitingRoom = 'WaitingRoom',
}

export interface MeetChatMessage extends Pick<ChatMessage, 'id' | 'message' | 'timestamp'> {
    identity: string;
    name: string;
    seen?: boolean;
    type: 'message';
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
    type: 'event';
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
