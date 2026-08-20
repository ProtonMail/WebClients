import { createContext, useContext } from 'react';

import debounce from 'lodash/debounce';

import type { InitializeDevices, SwitchActiveDevice, ToggleAudioType, ToggleVideoType } from '../../types';
import type { BackgroundEffect, VirtualBackgroundId } from '../../utils/virtualBackgrounds/virtualBackgrounds';
import type { InitializingBackgroundEffect } from './useBackgroundEffectInitializationState';

export interface MediaManagementContextType {
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
    toggleVideo: ToggleVideoType;
    toggleAudio: ToggleAudioType;
    handleMicrophoneToggle: () => void | Promise<unknown>;
    handleCameraToggle: () => void | Promise<unknown>;
    backgroundBlur: boolean;
    toggleBackgroundBlur: ReturnType<typeof debounce>;
    virtualBackgroundId: VirtualBackgroundId | null;
    appliedBackgroundEffect: BackgroundEffect;
    pendingBackgroundEffect: BackgroundEffect | null;
    selectBackgroundEffect: (effect: BackgroundEffect) => Promise<void>;
    isBackgroundBlurSupported: boolean;
    initializingBackgroundEffect: InitializingBackgroundEffect | null;
    failedBackgroundEffect: InitializingBackgroundEffect | null;
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
    backgroundBlur: false,
    toggleBackgroundBlur: debounce(() => Promise.resolve(), 500),
    virtualBackgroundId: null,
    appliedBackgroundEffect: 'none',
    pendingBackgroundEffect: null,
    selectBackgroundEffect: () => Promise.resolve(),
    isBackgroundBlurSupported: true,
    initializingBackgroundEffect: null,
    failedBackgroundEffect: null,
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
