export type { SerializableDeviceInfo } from '@proton/meet/utils/deviceUtils';
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

export type { SliceDeviceState as DeviceState } from '@proton/meet/store/slices/deviceManagementSlice';

export enum RecordingStatus {
    Started = 'started',
    Stopped = 'stopped',
}

export enum PublishableDataTypes {
    RecordingStatus = 'recordingStatus',
    Message = 'message',
    EmojiReaction = 'emojiReaction',
    RaiseHand = 'raiseHand',
    LowerHandAdmin = 'lowerHandAdmin',
    ChatMessageReaction = 'chatMessageReaction',
}

export type ToggleVideoType = (params: {
    isEnabled?: boolean;
    videoDeviceId?: string;
    forceUpdate?: boolean;
    preserveCache?: boolean;
}) => Promise<boolean | undefined>;

export type MeetButtonClass = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger-secondary';
