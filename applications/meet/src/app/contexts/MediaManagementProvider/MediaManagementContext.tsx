import { createContext, useContext } from 'react';

import debounce from 'lodash/debounce';

import type { SwitchActiveDevice, ToggleVideoType } from '../../types';

export interface MediaManagementContextType {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: ToggleVideoType;
    toggleAudio: ({
        isEnabled,
        audioDeviceId,
        preserveCache,
    }: {
        isEnabled?: boolean;
        audioDeviceId?: string;
        preserveCache?: boolean;
    }) => Promise<boolean | undefined>;
    backgroundBlur: boolean;
    toggleBackgroundBlur: ReturnType<typeof debounce>;
    isBackgroundBlurSupported: boolean;
    noiseFilter: boolean;
    toggleNoiseFilter: () => Promise<void>;
    handleRotateCamera: () => void;
    facingMode: 'environment' | 'user';
    switchActiveDevice: SwitchActiveDevice;
    initializeDevices: (timeoutMs?: number) => Promise<void>;
    getMicrophoneVolumeAnalysis: () => {
        analyser: AnalyserNode | null;
        dataArray: Uint8Array<ArrayBuffer> | null;
    };
    initializeMicrophoneVolumeAnalysis: (deviceId: string | null) => Promise<void>;
    cleanupMicrophoneVolumeAnalysis: () => void;
    handlePreviewCameraToggle: (videoElement: HTMLVideoElement) => Promise<void>;
    cleanupPreviewTrack: () => Promise<void>;
}

const defaultValues: MediaManagementContextType = {
    isVideoEnabled: false,
    isAudioEnabled: false,
    toggleVideo: () => Promise.resolve(undefined),
    toggleAudio: () => Promise.resolve(undefined),
    backgroundBlur: false,
    toggleBackgroundBlur: debounce(() => Promise.resolve(), 500),
    isBackgroundBlurSupported: true,
    noiseFilter: false,
    toggleNoiseFilter: () => Promise.resolve(),
    handleRotateCamera: () => {},
    facingMode: 'user',
    switchActiveDevice: () => Promise.resolve(),
    initializeDevices: () => Promise.resolve(),
    getMicrophoneVolumeAnalysis: () => ({
        analyser: null,
        dataArray: null,
    }),
    initializeMicrophoneVolumeAnalysis: () => Promise.resolve(),
    cleanupMicrophoneVolumeAnalysis: () => {},
    handlePreviewCameraToggle: () => Promise.resolve(),
    cleanupPreviewTrack: () => Promise.resolve(),
};

export const MediaManagementContext = createContext<MediaManagementContextType>(defaultValues);

export const useMediaManagementContext = () => {
    const context = useContext(MediaManagementContext);
    if (!context) {
        throw new Error('useMediaManagementContext must be used within a MediaManagementProvider');
    }
    return context;
};
