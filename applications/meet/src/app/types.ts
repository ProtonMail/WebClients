export { MeetingSideBars, PopUpControls, PermissionPromptStatus } from '@proton/meet/store/slices/uiStateSlice';

export enum LoadingState {
    JoiningInProgress = 'JoiningInProgress',
    WaitingRoom = 'WaitingRoom',
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
