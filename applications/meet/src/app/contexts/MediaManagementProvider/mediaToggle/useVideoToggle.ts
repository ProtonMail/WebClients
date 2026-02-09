import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, LocalTrackPublication, LocalVideoTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { DEFAULT_DEVICE_ID } from '../../../constants';
import { useStableCallback } from '../../../hooks/useStableCallback';
import type { BackgroundBlurProcessor } from '../../../processors/background-processor/MulticlassBackgroundProcessor';
import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
} from '../../../processors/background-processor/createBackgroundProcessor';
import type { SwitchActiveDevice } from '../../../types';
import { getPersistedBackgroundBlur, persistBackgroundBlur } from '../../../utils/backgroundBlurPersistance';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};

export const useVideoToggle = (
    activeCameraDeviceId: string,
    switchActiveDevice: SwitchActiveDevice,
    initialCameraState: boolean,
    systemDefaultCamera: MediaDeviceInfo,
    cameras: MediaDeviceInfo[]
) => {
    const reportError = useMeetErrorReporting();
    const room = useRoomContext();
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(getPersistedBackgroundBlur());

    const toggleInProgress = useRef(false);
    const blurToggleInProgress = useRef(false);
    const processorAttachInProgress = useRef(false);

    const prevEnabled = useRef<boolean | null>(null);
    const preventAutoApplyingBlur = useRef(false);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);

    const getCurrentVideoTrack = () => {
        return getVideoTrackPublications(room.localParticipant).filter(
            (publication) => publication.source === Track.Source.Camera
        )[0]?.track as LocalVideoTrack | undefined;
    };

    const attachBackgroundBlurProcessor = useStableCallback(async () => {
        if (processorAttachInProgress.current) {
            return null;
        }

        processorAttachInProgress.current = true;
        try {
            const result = await ensureBackgroundBlurProcessor(
                getCurrentVideoTrack(),
                backgroundBlurProcessorInstanceRef.current
            );
            return result;
        } finally {
            processorAttachInProgress.current = false;
        }
    });

    const toggleVideo = useStableCallback(
        async (
            params: {
                isEnabled?: boolean;
                videoDeviceId?: string;
                facingMode?: 'environment' | 'user';
                preserveCache?: boolean;
                recoveringFromError?: boolean;
            } = {}
        ) => {
            let toggleResult = false;

            const {
                isEnabled = prevEnabled.current ?? initialCameraState,
                videoDeviceId = activeCameraDeviceId,
                facingMode: customFacingMode,
                preserveCache,
                recoveringFromError = false,
            } = params;

            const deviceId = videoDeviceId === DEFAULT_DEVICE_ID ? systemDefaultCamera.deviceId : videoDeviceId;

            if (toggleInProgress.current || !deviceId) {
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

            try {
                if (currentVideoTrack) {
                    try {
                        // Ensure processor is fully stopped before proceeding
                        await currentVideoTrack.stopProcessor();
                    } catch (error) {
                        // eslint-disable-next-line no-console
                        console.error('Error stopping processor:', error);
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

                if (backgroundBlur && backgroundBlurProcessorInstanceRef.current && newVideoTrack) {
                    // Prevent the localTrackPublished handler from also trying to attach the processor
                    preventAutoApplyingBlur.current = true;

                    // Use our guarded attachment to prevent concurrent initializations
                    await attachBackgroundBlurProcessor();
                }

                // We need to restart the video track on mobile to make sure the facing mode is applied
                if (customFacingMode) {
                    await newVideoTrack?.restartTrack({ facingMode: customFacingMode });
                }

                toggleResult = true;
            } catch (error) {
                reportError('Failed to toggle video', error);
                // eslint-disable-next-line no-console
                console.error(error);

                const isPotentialStaleDeviceState = ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE.includes(
                    (error as Error)?.name
                );

                // Recovering from potential stale device state
                if (
                    !recoveringFromError &&
                    isPotentialStaleDeviceState &&
                    cameras.length > 0 &&
                    cameras[0].deviceId !== deviceId
                ) {
                    toggleInProgress.current = false;

                    const recoveryResult = (await toggleVideo({
                        isEnabled,
                        videoDeviceId: cameras[0].deviceId,
                        recoveringFromError: true,
                        preserveCache: false,
                    })) as boolean;
                    toggleResult = recoveryResult ?? false;
                }
            } finally {
                toggleInProgress.current = false;
            }

            return toggleResult;
        }
    );

    const handleRotateCamera = useCallback(async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        if (room.state === ConnectionState.Connected) {
            await toggleVideo({
                isEnabled: true,
                facingMode: newFacingMode,
            });
        }
    }, [facingMode, toggleVideo]);

    const toggleBackgroundBlur = useStableCallback(async () => {
        if (!backgroundBlurProcessorInstanceRef.current || blurToggleInProgress.current) {
            return;
        }

        blurToggleInProgress.current = true;

        const shouldEnableBlur = !backgroundBlur;

        try {
            if (shouldEnableBlur) {
                const processor = await attachBackgroundBlurProcessor();
                processor?.enable?.();
            } else {
                backgroundBlurProcessorInstanceRef.current?.disable?.();
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error toggling background blur', error);

            reportError('Failed to toggle background blur', error);
            return;
        } finally {
            blurToggleInProgress.current = false;
        }

        setBackgroundBlur(shouldEnableBlur);
        persistBackgroundBlur(shouldEnableBlur);
    });

    useEffect(() => {
        const preventApplyingBlur = () => {
            if (!initialCameraState) {
                preventAutoApplyingBlur.current = true;
            }
        };

        const handleDisconnected = () => {
            preventAutoApplyingBlur.current = false;
        };

        room.on(ConnectionState.Connected, preventApplyingBlur);
        room.on(ConnectionState.Disconnected, handleDisconnected);

        return () => {
            room.off(ConnectionState.Connected, preventApplyingBlur);
            room.off(ConnectionState.Disconnected, handleDisconnected);
        };
    }, [initialCameraState]);

    useEffect(() => {
        const handleTrackPublished = async (publication: LocalTrackPublication) => {
            if (
                publication.kind === Track.Kind.Video &&
                publication.source === Track.Source.Camera &&
                backgroundBlur &&
                !preventAutoApplyingBlur.current
            ) {
                preventAutoApplyingBlur.current = true;
                const processor = await attachBackgroundBlurProcessor();
                processor?.enable();
            }
        };

        localParticipant.on(RoomEvent.LocalTrackPublished, handleTrackPublished);

        return () => {
            localParticipant.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
        };
    }, [localParticipant, backgroundBlur]);

    useEffect(() => {
        backgroundBlurProcessorInstanceRef.current = createBackgroundProcessor();
        return () => {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            void backgroundBlurProcessorInstanceRef.current?.destroy?.();
        };
    }, []);

    // Too frequent toggling can freeze the page completely
    const debouncedToggleBackgroundBlur = useMemo(
        () => debounce(toggleBackgroundBlur, 500, { leading: true, trailing: false }),
        [toggleBackgroundBlur]
    );

    const debouncedToggleVideo = useMemo(() => debounce(toggleVideo, 500, { leading: true }), [toggleVideo]);

    return {
        toggleVideo: debouncedToggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        isVideoEnabled: isCameraEnabled,
        facingMode,
        isBackgroundBlurSupported: !!backgroundBlurProcessorInstanceRef.current,
    };
};
