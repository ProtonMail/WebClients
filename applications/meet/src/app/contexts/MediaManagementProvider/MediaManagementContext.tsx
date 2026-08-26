import { createContext, useContext } from 'react';

import type { InitializeDevices, SwitchActiveDevice, ToggleAudioType, ToggleVideoType } from '../../types';

export interface MediaManagementContextType {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: ToggleVideoType;
    toggleAudio: ToggleAudioType;
    handleMicrophoneToggle: () => void | Promise<unknown>;
    handleCameraToggle: () => void | Promise<unknown>;
    noiseFilter: boolean;
    toggleNoiseFilter: () => Promise<void>;
    handleRotateCamera: () => void;
    facingMode: 'environment' | 'user';
    switchActiveDevice: SwitchActiveDevice;
    initializeDevices: InitializeDevices;
    getMicrophoneVolumeAnalysis: () => {
        analyser: AnalyserNode | null;
        dataArray: Uint8Array<ArrayBuffer> | null;
    };
    initializeMicrophoneVolumeAnalysis: (deviceId: string | null) => Promise<void>;
    cleanupMicrophoneVolumeAnalysis: () => void;
    handlePreviewCameraToggle: (videoElement: HTMLVideoElement) => Promise<boolean>;
    cleanupPreviewTrack: () => Promise<void>;
    cleanupCameraPreview: () => Promise<void>;
}

const defaultValues: MediaManagementContextType = {
    isVideoEnabled: false,
    isAudioEnabled: false,
    toggleVideo: () => Promise.resolve(undefined),
    toggleAudio: () => Promise.resolve(undefined),
    handleMicrophoneToggle: () => {},
    handleCameraToggle: () => {},
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
    handlePreviewCameraToggle: () => Promise.resolve(false),
    cleanupPreviewTrack: () => Promise.resolve(),
    cleanupCameraPreview: () => Promise.resolve(),
};

export const MediaManagementContext = createContext<MediaManagementContextType>(defaultValues);

export const useMediaManagementContext = () => {
    const context = useContext(MediaManagementContext);
    if (!context) {
        throw new Error('useMediaManagementContext must be used within a MediaManagementProvider');
    }
    return context;
};
