export { MeetingSideBars } from '@proton/meet/store/slices/uiStateSlice';

export enum QualityScenarios {
    // ScreenShare = 'ScreenShare',
    PortraitView = 'PortraitView',
    MediumView = 'MediumView',
    SmallView = 'SmallView',
}

export type SwitchActiveDevice = (params: {
    deviceType: 'audioinput' | 'audiooutput' | 'videoinput';
    deviceId: string;
    isSystemDefaultDevice: boolean;
    preserveDefaultDevice?: boolean;
    throwOnError?: boolean;
}) => Promise<void>;

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
    facingMode?: 'environment' | 'user';
    preserveCache?: boolean;
    recoveringFromError?: boolean;
    updateUserIntent?: boolean;
}) => Promise<boolean | undefined>;

export type AudioToggleParams = {
    isEnabled?: boolean;
    audioDeviceId?: string;
    preserveCache?: boolean;
    skipNoiseFilter?: boolean;
};

export type ToggleAudioType = (params: AudioToggleParams) => Promise<boolean | undefined>;

export type InitializeDevices = (params: {
    timeoutMs?: number;
    desiredCameraState?: boolean;
    desiredMicrophoneState?: boolean;
}) => Promise<void>;

export type MeetButtonClass = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'danger-secondary';

/**
 * Router state for the /join route.
 */
export type JoinLocationState = {
    instantJoin?: boolean;
    meetingDetails?: {
        meetingName: string;
        isPersonalRoom: boolean;
        waitingRoom: boolean;
        canManageWaitingRoom: boolean;
    };
};

export type MeetingVariant = 'purple' | 'orange' | 'blue' | 'green' | 'red';
