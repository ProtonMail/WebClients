import { useEffect, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, LocalTrackPublication, LocalVideoTrack } from 'livekit-client';
import { ConnectionState, Track } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import debounce from '@proton/utils/debounce';

import { DEFAULT_DEVICE_ID } from '../constants';
import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
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
    const blurToggleInProgress = useRef(false);

    const prevEnabled = useRef<boolean | null>(null);
    const preventAutoApplyingBlur = useRef(false);

    useEffect(() => {
        void preloadBackgroundProcessorAssets();
    }, []);

    const getCurrentVideoTrack = () => {
        return getVideoTrackPublications(localParticipant).filter(
            (publication) => publication.source === Track.Source.Camera
        )[0]?.track as LocalVideoTrack | undefined;
    };

    const attachBackgroundBlurProcessor = async () => {
        return ensureBackgroundBlurProcessor(getCurrentVideoTrack(), backgroundBlurProcessorInstance);
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
                  };

        const currentVideoTrack = getCurrentVideoTrack();

        if (currentVideoTrack) {
            try {
                await currentVideoTrack.stopProcessor();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
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
            await newVideoTrack?.restartTrack({ facingMode: customFacingMode });
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
        const processor = await attachBackgroundBlurProcessor();
        processor?.enable();
    };

    const toggleBackgroundBlur = async () => {
        if (!backgroundBlurProcessorInstance || blurToggleInProgress.current) {
            return;
        }

        blurToggleInProgress.current = true;

        const shouldEnableBlur = !backgroundBlur;

        try {
            if (shouldEnableBlur) {
                const processor = await attachBackgroundBlurProcessor();
                processor?.enable?.();
            } else {
                backgroundBlurProcessorInstance?.disable?.();
            }
        } catch (error) {
            return;
        } finally {
            blurToggleInProgress.current = false;
        }

        setBackgroundBlur(shouldEnableBlur);
        persistBackgroundBlur(shouldEnableBlur);
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
    const debouncedToggleBackgroundBlur = debounce(toggleBackgroundBlur, 1000, { leading: true, trailing: false });

    const debouncedToggleVideo = debounce(toggleVideo, 1000, { leading: true });

    return {
        toggleVideo: debouncedToggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        isVideoEnabled: isCameraEnabled,
        facingMode,
        isBackgroundBlurSupported: !!backgroundBlurProcessorInstance,
    };
};
