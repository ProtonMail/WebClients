import { createContext, useContext } from 'react';

import debounce from '@proton/utils/debounce';

import type { DeviceState, SwitchActiveDevice } from '../types';

const DEFAULT_DEVICE_STATE: DeviceState = {
    systemDefault: null,
    systemDefaultLabel: '',
    useSystemDefault: true,
    preferredAvailable: false,
    preferredDevice: null,
};

export interface MediaManagementContextType {
    devicePermissions: {
        camera?: PermissionState;
        microphone?: PermissionState;
    };
    handleDevicePermissionChange: (permissions: { camera?: PermissionState; microphone?: PermissionState }) => void;
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
    speakers: MediaDeviceInfo[];
    selectedCameraId: string;
    selectedMicrophoneId: string;
    selectedAudioOutputDeviceId: string;
    defaultCamera: MediaDeviceInfo | null;
    defaultMicrophone: MediaDeviceInfo | null;
    defaultSpeaker: MediaDeviceInfo | null;
    cameraState: DeviceState;
    microphoneState: DeviceState;
    speakerState: DeviceState;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: ({
        isEnabled,
        videoDeviceId,
        forceUpdate,
        preserveCache,
    }: {
        isEnabled?: boolean;
        videoDeviceId?: string;
        forceUpdate?: boolean;
        preserveCache?: boolean;
    }) => Promise<void>;
    toggleAudio: ({
        isEnabled,
        audioDeviceId,
        preserveCache,
    }: {
        isEnabled?: boolean;
        audioDeviceId?: string | null;
        preserveCache?: boolean;
    }) => Promise<void>;
    backgroundBlur: boolean;
    toggleBackgroundBlur: ReturnType<typeof debounce>;
    isBackgroundBlurSupported: boolean;
    noiseFilter: boolean;
    toggleNoiseFilter: () => Promise<void>;
    handleRotateCamera: () => void;
    initialCameraState: boolean;
    initialAudioState: boolean;
    setInitialCameraState: (initialCameraState: boolean) => void;
    setInitialAudioState: (initialAudioState: boolean) => void;
    switchActiveDevice: SwitchActiveDevice;
    initializeDevices: () => Promise<void>;
    facingMode: 'environment' | 'user';
}

const defaultValues: MediaManagementContextType = {
    devicePermissions: {
        camera: 'prompt',
        microphone: 'prompt',
    },
    handleDevicePermissionChange: () => {},
    microphones: [],
    cameras: [],
    speakers: [],
    selectedCameraId: '',
    selectedMicrophoneId: '',
    selectedAudioOutputDeviceId: '',
    defaultCamera: null,
    defaultMicrophone: null,
    defaultSpeaker: null,
    cameraState: DEFAULT_DEVICE_STATE,
    microphoneState: DEFAULT_DEVICE_STATE,
    speakerState: DEFAULT_DEVICE_STATE,
    isVideoEnabled: false,
    isAudioEnabled: false,
    toggleVideo: () => Promise.resolve(),
    toggleAudio: () => Promise.resolve(),
    backgroundBlur: false,
    toggleBackgroundBlur: debounce(() => Promise.resolve(), 500),
    isBackgroundBlurSupported: true,
    noiseFilter: false,
    toggleNoiseFilter: () => Promise.resolve(),
    handleRotateCamera: () => {},
    initialCameraState: false,
    initialAudioState: false,
    setInitialCameraState: () => {},
    setInitialAudioState: () => {},
    switchActiveDevice: () => Promise.resolve(),
    initializeDevices: () => Promise.resolve(),
    facingMode: 'user',
};

export const MediaManagementContext = createContext<MediaManagementContextType>(defaultValues);

export const useMediaManagementContext = () => {
    const context = useContext(MediaManagementContext);
    if (!context) {
        throw new Error('useMediaManagementContext must be used within a MediaManagementProvider');
    }
    return context;
};
