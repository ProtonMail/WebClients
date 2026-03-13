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

export interface MeetingDetails {
    meetingId: string;
    meetingName: string;
    date: string;
    time: string;
    meetingLink: string;
    duration: string;
}

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

export enum RecordingStatus {
    Started = 'started',
    Stopped = 'stopped',
}

export enum PublishableDataTypes {
    RecordingStatus = 'recordingStatus',
    Message = 'message',
    EmojiReaction = 'emojiReaction',
    RaiseHand = 'raiseHand',
    ChatMessageReaction = 'chatMessageReaction',
}
