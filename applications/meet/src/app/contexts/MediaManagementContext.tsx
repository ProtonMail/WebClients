import { createContext, useContext } from 'react';

import debounce from '@proton/utils/debounce';

import type { SwitchActiveDevice } from '../types';

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
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: ({
        isEnabled,
        videoDeviceId,
        forceUpdate,
    }: {
        isEnabled?: boolean;
        videoDeviceId?: string;
        forceUpdate?: boolean;
    }) => Promise<void>;
    toggleAudio: ({
        isEnabled,
        audioDeviceId,
    }: {
        isEnabled?: boolean;
        audioDeviceId?: string | null;
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
    switchActiveDevice: () => {},
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
