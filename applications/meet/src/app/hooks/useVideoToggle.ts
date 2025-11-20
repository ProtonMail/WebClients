import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, LocalTrackPublication } from 'livekit-client';
import { ConnectionState, Track } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import debounce from '@proton/utils/debounce';

import { DEFAULT_DEVICE_ID } from '../constants';
import {
    createBackgroundProcessor,
    preloadBackgroundProcessorAssets,
} from '../processors/background-processor/createBackgroundProcessor';
import type { SwitchActiveDevice } from '../types';
import { getPersistedBackgroundBlur, persistBackgroundBlur } from '../utils/backgroundBlurPersistance';

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};
const backgroundBlurProcessorInstance = createBackgroundProcessor();

export const useVideoToggle = (
    activeCameraDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialCameraState: boolean,
    systemDefaultCamera: MediaDeviceInfo
) => {
    const room = useRoomContext();
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(getPersistedBackgroundBlur());

    const toggleInProgress = useRef(false);

    const prevEnabled = useRef<boolean | null>(null);
    const preventAutoApplyingBlur = useRef(false);

    useEffect(() => {
        void preloadBackgroundProcessorAssets();
    }, []);

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
            preserveCache?: boolean;
        } = {}
    ) => {
        const {
            isEnabled = prevEnabled.current ?? initialCameraState,
            videoDeviceId = activeCameraDeviceId,
            facingMode: customFacingMode,
            preserveCache,
        } = params;

        const deviceId = videoDeviceId === DEFAULT_DEVICE_ID ? systemDefaultCamera.deviceId : videoDeviceId;

        if (toggleInProgress.current) {
            return;
        }

        // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
        prevEnabled.current = isEnabled;

        toggleInProgress.current = true;

        const facingModeDependentOptions =
            customFacingMode || isMobile()
                ? {
                      facingMode: customFacingMode ?? facingMode,
                  }
                : {
                      deviceId: { exact: deviceId },
                      facingMode,
                  };

        const currentVideoTrack = getCurrentVideoTrack();

        // If we have a background blur processor, we need to stop it
        if (backgroundBlur) {
            await currentVideoTrack?.stopProcessor();
        }

        await switchActiveDevice({
            deviceType: 'videoinput',
            deviceId: deviceId as string,
            isSystemDefaultDevice: videoDeviceId === DEFAULT_DEVICE_ID,
            preserveDefaultDevice: !!preserveCache,
        });

        await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions);

        const newVideoTrack = getCurrentVideoTrack();

        if (backgroundBlur && backgroundBlurProcessorInstance) {
            try {
                await newVideoTrack?.setProcessor(backgroundBlurProcessorInstance);
            } catch (error) {}
        }

        // We need to restart the video track on mobile to make sure the facing mode is applied
        if (customFacingMode) {
            await newVideoTrack?.restartTrack({ facingMode: { exact: customFacingMode } });
        }

        toggleInProgress.current = false;
    };

    const handleRotateCamera = async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        if (room.state === ConnectionState.Connected) {
            await toggleVideo({
                isEnabled: true,
                facingMode: newFacingMode,
            });
        }
    };

    const turnOnBackgroundBlur = async () => {
        if (!backgroundBlurProcessorInstance) {
            return;
        }

        const currentVideoTrack = getCurrentVideoTrack();

        await currentVideoTrack?.setProcessor(backgroundBlurProcessorInstance);
    };

    const toggleBackgroundBlur = async () => {
        if (!backgroundBlurProcessorInstance) {
            return;
        }

        const currentVideoTrack = getCurrentVideoTrack();

        try {
            if (backgroundBlur) {
                await currentVideoTrack?.stopProcessor();
            } else {
                await currentVideoTrack?.setProcessor(backgroundBlurProcessorInstance);
            }
            setBackgroundBlur((prevEnableBlur) => !prevEnableBlur);
            persistBackgroundBlur(!backgroundBlur);
        } catch (error) {
            return;
        }
    };

    useEffect(() => {
        const preventApplyingBlur = () => {
            if (!initialCameraState) {
                preventAutoApplyingBlur.current = true;
            }
        };

        room.on(ConnectionState.Connected, preventApplyingBlur);
        room.on(ConnectionState.Disconnected, () => {
            preventAutoApplyingBlur.current = false;
        });

        return () => {
            room.off(ConnectionState.Connected, preventApplyingBlur);
            room.off(ConnectionState.Disconnected, () => {
                preventAutoApplyingBlur.current = false;
            });
        };
    }, [initialCameraState]);

    useEffect(() => {
        const handleTrackPublished = (publication: LocalTrackPublication) => {
            if (
                publication.kind === Track.Kind.Video &&
                publication.source === Track.Source.Camera &&
                backgroundBlur &&
                !preventAutoApplyingBlur.current
            ) {
                preventAutoApplyingBlur.current = true;
                void turnOnBackgroundBlur();
            }
        };

        localParticipant.on('localTrackPublished', handleTrackPublished);

        return () => {
            localParticipant.off('localTrackPublished', handleTrackPublished);
        };
    }, [localParticipant, backgroundBlur]);

    // Too frequent toggling can freeze the page completely
    const debouncedToggleBackgroundBlur = debounce(toggleBackgroundBlur, 500, { leading: true });

    return {
        toggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        isVideoEnabled: isCameraEnabled,
        facingMode,
        isBackgroundBlurSupported: !!backgroundBlurProcessorInstance,
    };
};
