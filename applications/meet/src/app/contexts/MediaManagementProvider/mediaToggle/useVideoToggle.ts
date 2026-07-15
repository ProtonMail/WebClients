import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalParticipant, LocalTrackPublication, LocalVideoTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { setUserCameraIntent } from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveCameraId,
    selectInitialCameraState,
    selectRealtimeDevices,
    selectUserCameraIntent,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useStableCallback } from '../../../hooks/useStableCallback';
import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
} from '../../../processors/background-processor/createBackgroundProcessor';
import type {
    BackgroundBlurProcessor,
    BackgroundProcessorVersion,
} from '../../../processors/background-processor/types';
import type { SwitchActiveDevice, ToggleVideoType } from '../../../types';
import { getPersistedBackgroundBlur, persistBackgroundBlur } from '../../../utils/backgroundBlurPersistance';
import type { BlurInitializationState } from '../useBlurInitializationState';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};

interface UseVideoToggleParams {
    switchActiveDevice: SwitchActiveDevice;
    backgroundProcessorVersion: BackgroundProcessorVersion;
    trackBlurInitialization: BlurInitializationState['trackBlurInitialization'];
    cancelBlurInitialization: BlurInitializationState['cancelBlurInitialization'];
}

export const useVideoToggle = ({
    switchActiveDevice,
    backgroundProcessorVersion,
    trackBlurInitialization,
    cancelBlurInitialization,
}: UseVideoToggleParams) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();

    const dispatch = useMeetDispatch();
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);
    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const userCameraIntent = useMeetSelector(selectUserCameraIntent);
    const store = useMeetStore();

    const room = useRoomContext();
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(getPersistedBackgroundBlur());

    const toggleInProgress = useRef(false);
    const blurToggleInProgress = useRef(false);
    const processorAttachInProgress = useRef(false);

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

        const videoTrack = getCurrentVideoTrack();

        // Blank the raw camera only while the processor is being attached: disabling
        // the source makes the browser emit black frames (not a mute, so peers aren't
        // notified) instead of leaking unblurred video during the track swap. Once
        // attached, the processor's own output is what's published and it emits black
        // frames until its first mask is ready, so re-enabling the source in `finally`
        // can't reintroduce an unblurred flash — the source is now only the
        // processor's input. It MUST be re-enabled promptly: on Safari's
        // canvas.captureStream fallback the processor's render loop is driven by the
        // source track, so leaving it disabled would starve the processor of frames.
        const rawMediaStreamTrack = videoTrack?.mediaStreamTrack;
        const shouldBlankRawFrames = !!rawMediaStreamTrack && rawMediaStreamTrack.enabled;
        if (shouldBlankRawFrames) {
            rawMediaStreamTrack.enabled = false;
        }

        try {
            const result = await ensureBackgroundBlurProcessor(videoTrack, backgroundBlurProcessorInstanceRef.current);

            if (result?.waitUntilBlurApplied) {
                const { waitUntilBlurApplied } = result;
                trackBlurInitialization(() => waitUntilBlurApplied());
            }

            return result;
        } finally {
            if (shouldBlankRawFrames) {
                rawMediaStreamTrack.enabled = true;
            }
            processorAttachInProgress.current = false;
        }
    });

    const toggleVideo: ToggleVideoType = useStableCallback(
        async ({
            isEnabled = userCameraIntent ?? initialCameraState,
            videoDeviceId = activeCameraDeviceId,
            facingMode: customFacingMode,
            preserveCache,
            recoveringFromError = false,
            updateUserIntent = true,
        } = {}) => {
            let toggleResult = false;

            const deviceId = videoDeviceId;

            if (toggleInProgress.current || (!deviceId && !isMobile())) {
                return;
            }

            // In case of unplugging a device LiveKit sets the enabled status to false, but we want to keep the previous state
            if (updateUserIntent) {
                dispatch(setUserCameraIntent(isEnabled));
            }

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
                    isSystemDefaultDevice: false,
                    preserveDefaultDevice: !!preserveCache,
                    throwOnError: true,
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

                const updatedCameras = await selectRealtimeDevices(store, 'videoinput');

                const isPotentialStaleDeviceState = ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE.includes(
                    (error as Error)?.name
                );

                // Pick any available camera other than the one that just failed.
                const fallback = updatedCameras.find((d) => d.deviceId && d.deviceId !== deviceId);

                // Recovering from potential stale device state
                if (!recoveringFromError && isPotentialStaleDeviceState && updatedCameras.length > 0 && fallback) {
                    // eslint-disable-next-line no-console
                    console.log('[toggleVideo] recovering with fallback', fallback.deviceId);

                    toggleInProgress.current = false;

                    const recoveryResult = (await toggleVideo({
                        isEnabled,
                        videoDeviceId: fallback.deviceId,
                        recoveringFromError: true,
                        preserveCache: false,
                    })) as boolean;
                    toggleResult = recoveryResult ?? false;
                } else {
                    reportError('Failed to toggle video', {
                        context: {
                            error,
                            recoveringFromError,
                            isPotentialStaleDeviceState,
                            hasFallback: !!fallback,
                        },
                    });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                cancelBlurInitialization();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localParticipant, backgroundBlur]);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const processor = await createBackgroundProcessor(false, backgroundProcessorVersion);

            // The effect was cleaned up before the implementation finished loading,
            // so tear down the freshly created processor instead of keeping it.
            if (cancelled) {
                processor?.disable?.();
                void processor?.destroy?.();
                return;
            }

            backgroundBlurProcessorInstanceRef.current = processor;
        })();

        return () => {
            cancelled = true;
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            void backgroundBlurProcessorInstanceRef.current?.destroy?.();
        };
    }, [backgroundProcessorVersion]);

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
