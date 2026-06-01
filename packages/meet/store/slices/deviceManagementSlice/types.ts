import type { SerializableDeviceInfo } from '../../../utils/deviceUtils';

export enum PermissionsModalType {
    NONE = 'none',
    PERMISSIONS_MODAL = 'permissionsModal',
    PERMISSIONS_BLOCKED_MODAL = 'permissionsBlockedModal',
    PERMISSIONS_BLOCKED_CAMERA_MODAL = 'permissionsBlockedCameraModal',
    PERMISSIONS_BLOCKED_MICROPHONE_MODAL = 'permissionsBlockedMicrophoneModal',
    PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL = 'permissionsBlockedScreenShareModal',
}

export interface DeviceManagementState {
    // Permissions
    permissions: {
        camera: PermissionState;
        microphone: PermissionState;
    };

    // Devices lists
    cameras: SerializableDeviceInfo[];
    microphones: SerializableDeviceInfo[];
    speakers: SerializableDeviceInfo[];

    // Preferred devices
    preferredCameraId: string | null;
    preferredMicrophoneId: string | null;
    preferredSpeakerId: string | null;

    // Active devices
    activeCameraId: string;
    activeMicrophoneId: string;
    activeAudioOutputId: string;

    // Initial states
    initialCameraState: boolean;
    initialAudioState: boolean;

    // User intent, used to store the user's intent when the camera is toggled manually
    userCameraIntent: boolean | null;

    // UI
    uiModals: {
        permissionsModal: PermissionsModalType;
    };
}

export type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export interface SliceDeviceState {
    systemDefault: SerializableDeviceInfo | null;
    systemDefaultLabel: string;
    hasDefaultOption: boolean;
    useSystemDefault: boolean;
    preferredAvailable: boolean;
    preferredDevice: SerializableDeviceInfo | null;
    preferredDeviceId: string | null;
}
