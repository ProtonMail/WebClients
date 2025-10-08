import { useRef, useState } from 'react';

import { useLocalParticipant } from '@livekit/components-react';
import { BackgroundBlur, type BackgroundProcessorOptions } from '@livekit/track-processors';
import type { LocalParticipant } from '@proton-meet/livekit-client';
import { Track } from '@proton-meet/livekit-client';

import debounce from '@proton/utils/debounce';

import type { SwitchActiveDevice } from '../types';

const backgroundProcessorOptions: BackgroundProcessorOptions = {
    assetPaths: {
        tasksVisionFileSet: '/assets/background-blur',
        modelAssetPath: 'assets/background-blur/selfie_segmenter.tflite',
    },
};

const backgroundBlurProcessor = BackgroundBlur(40, undefined, undefined, backgroundProcessorOptions);

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};

export const useVideoToggle = (
    activeCameraDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialCameraState: boolean
) => {
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(false);

    const toggleInProgress = useRef(false);

    const prevEnabled = useRef<boolean | null>(null);

    const getCurrentVideoTrack = () => {
        return getVideoTrackPublications(localParticipant).filter(
            (publication) => publication.source === Track.Source.Camera
        )[0]?.track;
    };

    const toggleVideo = async (
        params: {
            isEnabled?: boolean;
            videoDeviceId?: string;
            facingMode?: 'environment' | 'user';
        } = {}
    ) => {
        const {
            isEnabled = prevEnabled.current ?? initialCameraState,
            videoDeviceId = activeCameraDeviceId,
            facingMode: customFacingMode,
        } = params;

        if (toggleInProgress.current) {
            return;
        }

        // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
        prevEnabled.current = isEnabled;

        toggleInProgress.current = true;

        const facingModeDependentOptions = customFacingMode
            ? {
                  facingMode: customFacingMode ?? facingMode,
              }
            : {
                  deviceId: { exact: videoDeviceId },
              };

        const currentVideoTrack = getCurrentVideoTrack();

        // If we have a background blur processor, we need to stop it
        if (backgroundBlur) {
            await currentVideoTrack?.stopProcessor();
        }

        await switchActiveDevice('videoinput', videoDeviceId as string);
        await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions);

        const newVideoTrack = getCurrentVideoTrack();

        // Adding background blur processor after applying updates
        if (backgroundBlur) {
            await newVideoTrack?.setProcessor(backgroundBlurProcessor);
        }

        toggleInProgress.current = false;
    };

    const handleRotateCamera = async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        const videoTrack = [...localParticipant.trackPublications.values()].find(
            (item) => item.kind === Track.Kind.Video && item.source !== Track.Source.ScreenShare
        )?.track;

        if (videoTrack) {
            await toggleVideo({
                isEnabled: true,
                facingMode: newFacingMode,
            });
        }
    };

    const toggleBackgroundBlur = async () => {
        const currentVideoTrack = getCurrentVideoTrack();

        if (backgroundBlur) {
            await currentVideoTrack?.stopProcessor();
        } else {
            await currentVideoTrack?.setProcessor(backgroundBlurProcessor);
        }

        setBackgroundBlur((prevEnableBlur) => !prevEnableBlur);
    };

    // Too frequent toggling can freeze the page completely
    const debouncedToggleBackgroundBlur = debounce(toggleBackgroundBlur, 500, { leading: true });

    return {
        toggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        isVideoEnabled: isCameraEnabled,
    };
};
