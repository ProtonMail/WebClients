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
    selectSelectedCameraId,
    selectUserCameraIntent,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { useStableCallback } from '../../../hooks/useStableCallback';
import {
    createBackgroundProcessor,
    createCustomBackgroundProcessor,
    ensureBackgroundProcessor,
} from '../../../processors/background-processor/createBackgroundProcessor';
import type {
    BackgroundBlurProcessor,
    BackgroundProcessorVersion,
    CustomBackgroundProcessor,
} from '../../../processors/background-processor/types';
import type { SwitchActiveDevice, ToggleVideoType } from '../../../types';
import { getPersistedBackgroundBlur, persistBackgroundBlur } from '../../../utils/backgroundBlurPersistance';
import { isDummyVideoTrack, markVideoTrackDeviceBacked } from '../../../utils/dummyVideoTrack';
import {
    getPersistedVirtualBackground,
    persistVirtualBackground,
} from '../../../utils/virtualBackgrounds/virtualBackgroundPersistance';
import type { BackgroundEffect, VirtualBackgroundId } from '../../../utils/virtualBackgrounds/virtualBackgrounds';
import { getVirtualBackgroundColor } from '../../../utils/virtualBackgrounds/virtualBackgrounds';
import type {
    BackgroundEffectInitializationState,
    InitializingBackgroundEffect,
} from '../useBackgroundEffectInitializationState';
import { ERRORS_SIGNALING_POTENTIAL_STALE_DEVICE_STATE } from './constants';

const getVideoTrackPublications = (localParticipant: LocalParticipant) => {
    return [...localParticipant.trackPublications.values()].filter(
        (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
    );
};

// Returned when another attach already owns the track, which must not be treated as a failure:
// the effect the user picked is still on its way in.
const ATTACH_SKIPPED = Symbol('attachSkipped');

interface UseVideoToggleParams {
    switchActiveDevice: SwitchActiveDevice;
    backgroundProcessorVersion: BackgroundProcessorVersion;
    trackBackgroundEffectInitialization: BackgroundEffectInitializationState['trackBackgroundEffectInitialization'];
    cancelBackgroundEffectInitialization: BackgroundEffectInitializationState['cancelBackgroundEffectInitialization'];
    reportBackgroundEffectFailure: BackgroundEffectInitializationState['reportBackgroundEffectFailure'];
}

export const useVideoToggle = ({
    switchActiveDevice,
    backgroundProcessorVersion,
    trackBackgroundEffectInitialization,
    cancelBackgroundEffectInitialization,
    reportBackgroundEffectFailure,
}: UseVideoToggleParams) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();

    const dispatch = useMeetDispatch();
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);
    const selectedCameraDeviceId = useMeetSelector(selectSelectedCameraId);
    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const userCameraIntent = useMeetSelector(selectUserCameraIntent);
    const store = useMeetStore();

    const room = useRoomContext();
    const { isCameraEnabled, localParticipant } = useLocalParticipant();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
    const [backgroundBlur, setBackgroundBlur] = useState(getPersistedBackgroundBlur());
    const [selectedVirtualBackgroundId, setVirtualBackgroundId] = useState<VirtualBackgroundId | null>(
        getPersistedVirtualBackground
    );
    const [pendingBackgroundEffect, setPendingBackgroundEffect] = useState<BackgroundEffect | null>(null);

    // The persisted pick outlives the flag, so a rollback must not keep applying a background the
    // user no longer has any way to change or turn off.
    const virtualBackgroundId = isVirtualBackgroundEnabled ? selectedVirtualBackgroundId : null;

    const toggleInProgress = useRef(false);
    const backgroundEffectChangeInProgress = useRef(false);
    const pendingBackgroundEffectRef = useRef<{ effect: BackgroundEffect } | null>(null);
    const processorAttachInProgress = useRef(false);

    const preventAutoApplyingBlur = useRef(false);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);
    const customBackgroundProcessorInstanceRef = useRef<CustomBackgroundProcessor | null>(null);
    const customBackgroundProcessorCreationRef = useRef<Promise<CustomBackgroundProcessor | null> | null>(null);

    const getCurrentVideoTrack = () => {
        return getVideoTrackPublications(room.localParticipant).filter(
            (publication) => publication.source === Track.Source.Camera
        )[0]?.track as LocalVideoTrack | undefined;
    };

    const isProcessorAttached = (processor: BackgroundBlurProcessor | CustomBackgroundProcessor | null) =>
        !!processor && getCurrentVideoTrack()?.getProcessor() === processor;

    const hasLiveCameraTrack = () => {
        const videoTrack = getCurrentVideoTrack();

        return !!videoTrack && !videoTrack.isMuted && videoTrack.mediaStreamTrack?.readyState === 'live';
    };

    const withBlankedRawFrames = async <T>(
        videoTrack: LocalVideoTrack | undefined,
        isSwappingProcessor: boolean,
        operation: () => Promise<T>
    ) => {
        const rawMediaStreamTrack = videoTrack?.mediaStreamTrack;
        const shouldBlankRawFrames = isSwappingProcessor && !!rawMediaStreamTrack && rawMediaStreamTrack.enabled;
        if (shouldBlankRawFrames) {
            rawMediaStreamTrack.enabled = false;
        }

        try {
            return await operation();
        } finally {
            if (shouldBlankRawFrames) {
                rawMediaStreamTrack.enabled = true;
            }
        }
    };

    const attachBackgroundBlurProcessor = useStableCallback(async () => {
        if (processorAttachInProgress.current) {
            return ATTACH_SKIPPED;
        }

        processorAttachInProgress.current = true;

        const videoTrack = getCurrentVideoTrack();
        const isSwappingProcessor = !isProcessorAttached(backgroundBlurProcessorInstanceRef.current);

        try {
            return await withBlankedRawFrames(videoTrack, isSwappingProcessor, async () => {
                const result = await ensureBackgroundProcessor(videoTrack, backgroundBlurProcessorInstanceRef.current);

                if (result?.waitUntilBlurApplied) {
                    const { waitUntilBlurApplied } = result;
                    trackBackgroundEffectInitialization('blur', () => waitUntilBlurApplied());
                }

                return result;
            });
        } finally {
            processorAttachInProgress.current = false;
        }
    });

    const ensureCustomBackgroundProcessor = useStableCallback(async (backgroundColor: string) => {
        const creation =
            customBackgroundProcessorCreationRef.current ?? createCustomBackgroundProcessor({ backgroundColor });
        customBackgroundProcessorCreationRef.current = creation;

        let processor: CustomBackgroundProcessor | null = null;

        try {
            processor = await creation;
        } finally {
            if (!processor && customBackgroundProcessorCreationRef.current === creation) {
                customBackgroundProcessorCreationRef.current = null;
            }
        }

        customBackgroundProcessorInstanceRef.current = processor;

        await processor?.setBackground?.({ backgroundColor });

        return processor;
    });

    const attachCustomBackgroundProcessor = useStableCallback(async () => {
        if (processorAttachInProgress.current) {
            return ATTACH_SKIPPED;
        }

        processorAttachInProgress.current = true;

        const videoTrack = getCurrentVideoTrack();
        const isSwappingProcessor = !isProcessorAttached(customBackgroundProcessorInstanceRef.current);

        try {
            return await withBlankedRawFrames(videoTrack, isSwappingProcessor, async () => {
                const result = await ensureBackgroundProcessor(
                    videoTrack,
                    customBackgroundProcessorInstanceRef.current
                );

                if (result?.waitUntilBackgroundApplied) {
                    const { waitUntilBackgroundApplied } = result;
                    trackBackgroundEffectInitialization('virtualBackground', () => waitUntilBackgroundApplied());
                }

                return result;
            });
        } finally {
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

            // When joining with camera off, a placeholder canvas track is published in place of the real camera
            const isReplacingDummyTrack = isEnabled && !!currentVideoTrack && isDummyVideoTrack(currentVideoTrack);

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

                if (isReplacingDummyTrack && currentVideoTrack) {
                    const replacementOptions =
                        customFacingMode || isMobile()
                            ? { facingMode: customFacingMode ?? facingMode }
                            : { deviceId: { exact: selectedCameraDeviceId || deviceId } };
                    await currentVideoTrack.restartTrack(replacementOptions);
                    await currentVideoTrack.unmute();
                    markVideoTrackDeviceBacked(currentVideoTrack);
                } else {
                    await localParticipant.setCameraEnabled(isEnabled, facingModeDependentOptions);
                }

                // Turning the camera off leaves the publication in place with a stopped source, so a processor
                // attached here would never receive a frame and its initialization would never settle.
                const canAttachProcessor = isEnabled && hasLiveCameraTrack();

                if (backgroundBlur && backgroundBlurProcessorInstanceRef.current && canAttachProcessor) {
                    // Prevent the localTrackPublished handler from also trying to attach the processor
                    preventAutoApplyingBlur.current = true;

                    // Use our guarded attachment to prevent concurrent initializations
                    await attachBackgroundBlurProcessor();
                } else if (virtualBackgroundId && customBackgroundProcessorInstanceRef.current && canAttachProcessor) {
                    preventAutoApplyingBlur.current = true;

                    await attachCustomBackgroundProcessor();
                }

                // We need to restart the video track on mobile to make sure the facing mode is applied
                if (customFacingMode) {
                    await getCurrentVideoTrack()?.restartTrack({ facingMode: customFacingMode });
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

    const recordBackgroundEffect = (effect: BackgroundEffect) => {
        const isBlur = effect === 'blur';
        const virtualBackground = effect === 'none' || isBlur ? null : effect;

        setBackgroundBlur(isBlur);
        persistBackgroundBlur(isBlur);
        setVirtualBackgroundId(virtualBackground);
        persistVirtualBackground(virtualBackground);
    };

    const abandonBackgroundEffects = (failedEffect: InitializingBackgroundEffect) => {
        backgroundBlurProcessorInstanceRef.current?.disable?.();
        customBackgroundProcessorInstanceRef.current?.disable?.();
        reportBackgroundEffectFailure(failedEffect);
        recordBackgroundEffect('none');
    };

    const applyBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        const isCameraLive = hasLiveCameraTrack();

        if (effect === 'none') {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            customBackgroundProcessorInstanceRef.current?.disable?.();
            cancelBackgroundEffectInitialization();
        } else if (effect === 'blur') {
            if (!backgroundBlurProcessorInstanceRef.current) {
                reportError('The background blur processor is unavailable', { context: { effect } });
                return;
            }

            if (isCameraLive) {
                const processor = await attachBackgroundBlurProcessor();

                if (!processor) {
                    reportError('Failed to attach the background blur processor', { context: { effect } });
                    abandonBackgroundEffects('blur');
                    return;
                }

                if (processor !== ATTACH_SKIPPED) {
                    processor.enable?.();
                }
            }

            customBackgroundProcessorInstanceRef.current?.disable?.();
        } else {
            if (!isVirtualBackgroundEnabled) {
                return;
            }

            const backgroundColor = getVirtualBackgroundColor(effect);
            const customProcessor = backgroundColor ? await ensureCustomBackgroundProcessor(backgroundColor) : null;

            if (!customProcessor) {
                reportError('Failed to create the virtual background processor', { context: { effect } });
                return;
            }

            if (isCameraLive) {
                const processor = await attachCustomBackgroundProcessor();

                if (!processor) {
                    reportError('Failed to attach the virtual background processor', { context: { effect } });
                    abandonBackgroundEffects('virtualBackground');
                    return;
                }

                if (processor !== ATTACH_SKIPPED) {
                    processor.enable?.();
                }
            }

            backgroundBlurProcessorInstanceRef.current?.disable?.();
        }

        recordBackgroundEffect(effect);
    });

    const selectBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        pendingBackgroundEffectRef.current = { effect };
        setPendingBackgroundEffect(effect);

        if (backgroundEffectChangeInProgress.current) {
            return;
        }

        backgroundEffectChangeInProgress.current = true;

        try {
            let pending: { effect: BackgroundEffect } | null = pendingBackgroundEffectRef.current;

            while (pending) {
                pendingBackgroundEffectRef.current = null;

                await applyBackgroundEffect(pending.effect);

                pending = pendingBackgroundEffectRef.current;
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error applying background effect', error);

            reportError('Failed to apply background effect', error);
        } finally {
            backgroundEffectChangeInProgress.current = false;
            pendingBackgroundEffectRef.current = null;
            setPendingBackgroundEffect(null);
        }
    });

    const toggleBackgroundBlur = useStableCallback(() => selectBackgroundEffect(backgroundBlur ? 'none' : 'blur'));

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
                publication.kind !== Track.Kind.Video ||
                publication.source !== Track.Source.Camera ||
                preventAutoApplyingBlur.current
            ) {
                return;
            }

            if (backgroundBlur) {
                preventAutoApplyingBlur.current = true;
                const processor = await attachBackgroundBlurProcessor();

                if (processor !== ATTACH_SKIPPED) {
                    processor?.enable();
                }
            } else if (virtualBackgroundId && customBackgroundProcessorInstanceRef.current) {
                preventAutoApplyingBlur.current = true;
                const processor = await attachCustomBackgroundProcessor();

                if (processor !== ATTACH_SKIPPED) {
                    processor?.enable();
                }
            }
        };

        localParticipant.on(RoomEvent.LocalTrackPublished, handleTrackPublished);

        return () => {
            localParticipant.off(RoomEvent.LocalTrackPublished, handleTrackPublished);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localParticipant, backgroundBlur, virtualBackgroundId]);

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

    useEffect(() => {
        const persistedVirtualBackground = isVirtualBackgroundEnabled ? getPersistedVirtualBackground() : null;
        const backgroundColor = persistedVirtualBackground
            ? getVirtualBackgroundColor(persistedVirtualBackground)
            : undefined;

        if (!backgroundColor) {
            return;
        }

        void ensureCustomBackgroundProcessor(backgroundColor);
    }, [ensureCustomBackgroundProcessor, isVirtualBackgroundEnabled]);

    useEffect(() => {
        return () => {
            customBackgroundProcessorInstanceRef.current?.disable?.();
            void customBackgroundProcessorInstanceRef.current?.destroy?.();
        };
    }, []);

    // Too frequent toggling can freeze the page completely
    const debouncedToggleBackgroundBlur = useMemo(
        () => debounce(toggleBackgroundBlur, 500, { leading: true, trailing: false }),
        [toggleBackgroundBlur]
    );

    const debouncedToggleVideo = useMemo(() => debounce(toggleVideo, 500, { leading: true }), [toggleVideo]);

    const appliedBackgroundEffect: BackgroundEffect = virtualBackgroundId ?? (backgroundBlur ? 'blur' : 'none');

    return {
        toggleVideo: debouncedToggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        virtualBackgroundId,
        appliedBackgroundEffect,
        pendingBackgroundEffect,
        selectBackgroundEffect,
        isVideoEnabled: isCameraEnabled,
        facingMode,
        isBackgroundBlurSupported: !!backgroundBlurProcessorInstanceRef.current,
    };
};
