import { useEffect, useMemo, useRef } from 'react';

import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import type { LocalTrackPublication, LocalVideoTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import type { BackgroundEffect, InitializingBackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import {
    applyBackgroundEffectAndPersist,
    selectAppliedBackgroundEffect,
    selectBackgroundBlur,
    setPendingBackgroundEffect,
} from '@proton/meet/store/slices/backgroundSlice';
import { selectInitialCameraState } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { resolveBackgroundSource } from '@proton/meet/utils/customBackgrounds';
import type { VirtualBackgroundSource } from '@proton/meet/utils/virtualBackgrounds';
import { useFlag } from '@proton/unleash/useFlag';

import { useStableCallback } from '../../hooks/useStableCallback';
import {
    createBackgroundProcessor,
    createCustomBackgroundProcessor,
    ensureBackgroundProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundBlurProcessor, CustomBackgroundProcessor } from '../../processors/background-processor/types';
import { getCurrentCameraTrack, hasLiveCameraTrack } from '../../utils/cameraTrack';
import { useCustomBackgroundId, useVirtualBackgroundId } from './useAppliedBackgroundEffect';
import { useBackgroundEffectInitializationTracker } from './useBackgroundEffectInitializationTracker';

// Returned when another attach already owns the track, which must not be treated as a failure:
// the effect the user picked is still on its way in.
const ATTACH_SKIPPED = Symbol('attachSkipped');

interface UseBackgroundEffectsParams {
    isBackgroundEffectsSupported: boolean;
}

export const useBackgroundEffects = ({ isBackgroundEffectsSupported }: UseBackgroundEffectsParams) => {
    const { reportMeetError: reportError } = useMeetErrorReporting();

    const dispatch = useMeetDispatch();
    const store = useMeetStore();
    const backgroundBlur = useMeetSelector(selectBackgroundBlur);
    const virtualBackgroundId = useVirtualBackgroundId();
    const customBackgroundId = useCustomBackgroundId();
    const initialCameraState = useMeetSelector(selectInitialCameraState);

    // Presets and custom uploads share one processor, so reattaching doesn't care which kind it is.
    const hasImageBackground = !!virtualBackgroundId || !!customBackgroundId;

    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');
    const canApplyImageBackground = isVirtualBackgroundEnabled && isBackgroundEffectsSupported;

    const { trackBackgroundEffectInitialization, cancelBackgroundEffectInitialization, reportBackgroundEffectFailure } =
        useBackgroundEffectInitializationTracker();

    const backgroundEffectChangeInProgress = useRef(false);
    const pendingBackgroundEffectRef = useRef<{ effect: BackgroundEffect } | null>(null);
    const processorAttachInProgress = useRef(false);

    const preventAutoApplyingBlur = useRef(false);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);
    const backgroundBlurProcessorCreationRef = useRef<Promise<BackgroundBlurProcessor | null> | null>(null);
    const customBackgroundProcessorInstanceRef = useRef<CustomBackgroundProcessor | null>(null);
    const customBackgroundProcessorCreationRef = useRef<Promise<CustomBackgroundProcessor | null> | null>(null);

    const isProcessorAttached = (processor: BackgroundBlurProcessor | CustomBackgroundProcessor | null) =>
        !!processor && getCurrentCameraTrack(room)?.getProcessor() === processor;

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

    const attachBackgroundBlurProcessor = useStableCallback(async (blurProcessor?: BackgroundBlurProcessor | null) => {
        if (processorAttachInProgress.current) {
            return ATTACH_SKIPPED;
        }

        processorAttachInProgress.current = true;

        const processorToAttach = blurProcessor ?? backgroundBlurProcessorInstanceRef.current;
        const videoTrack = getCurrentCameraTrack(room);
        const isSwappingProcessor = !isProcessorAttached(processorToAttach);

        try {
            return await withBlankedRawFrames(videoTrack, isSwappingProcessor, async () => {
                const result = await ensureBackgroundProcessor(videoTrack, processorToAttach);

                result?.enable?.();

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

    const ensureCustomBackgroundProcessor = useStableCallback(async (source: VirtualBackgroundSource) => {
        const creation = customBackgroundProcessorCreationRef.current ?? createCustomBackgroundProcessor(source);
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

        await processor?.setBackground?.(source);

        return processor;
    });

    const attachCustomBackgroundProcessor = useStableCallback(async () => {
        if (processorAttachInProgress.current) {
            return ATTACH_SKIPPED;
        }

        processorAttachInProgress.current = true;

        const videoTrack = getCurrentCameraTrack(room);
        const isSwappingProcessor = !isProcessorAttached(customBackgroundProcessorInstanceRef.current);

        try {
            return await withBlankedRawFrames(videoTrack, isSwappingProcessor, async () => {
                const result = await ensureBackgroundProcessor(
                    videoTrack,
                    customBackgroundProcessorInstanceRef.current
                );

                result?.enable?.();

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

    const abandonBackgroundEffects = (failedEffect: InitializingBackgroundEffect) => {
        backgroundBlurProcessorInstanceRef.current?.disable?.();
        customBackgroundProcessorInstanceRef.current?.disable?.();
        reportBackgroundEffectFailure(failedEffect);
        dispatch(applyBackgroundEffectAndPersist('none'));
    };

    const ensureBackgroundBlurProcessorInstance = useStableCallback(async () => {
        if (backgroundBlurProcessorInstanceRef.current) {
            return backgroundBlurProcessorInstanceRef.current;
        }

        const creation = backgroundBlurProcessorCreationRef.current;
        const processor = await creation;

        return backgroundBlurProcessorCreationRef.current === creation ? processor : null;
    });

    const applyBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        if (effect === 'none') {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            customBackgroundProcessorInstanceRef.current?.disable?.();
            cancelBackgroundEffectInitialization();
        } else if (effect === 'blur') {
            // The processor is still loading when blur is picked right after landing on the page.
            const blurProcessor = await ensureBackgroundBlurProcessorInstance();

            if (!blurProcessor) {
                reportError('The background blur processor is unavailable', { context: { effect } });
                return;
            }

            if (hasLiveCameraTrack(room)) {
                const processor = await attachBackgroundBlurProcessor(blurProcessor);

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
            if (!canApplyImageBackground) {
                return;
            }

            // A custom background is decrypted out of the cache, and possibly downloaded from Drive.
            const source = await resolveBackgroundSource(effect);

            if (!source) {
                reportError('The virtual background source is unavailable', { context: { effect } });
                return;
            }

            const customProcessor = await ensureCustomBackgroundProcessor(source);

            if (!customProcessor) {
                reportError('Failed to create the virtual background processor', { context: { effect } });
                return;
            }

            if (hasLiveCameraTrack(room)) {
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

        dispatch(applyBackgroundEffectAndPersist(effect));
    });

    const selectBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        pendingBackgroundEffectRef.current = { effect };
        dispatch(setPendingBackgroundEffect(effect));

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
            dispatch(setPendingBackgroundEffect(null));
        }
    });

    const toggleBackgroundBlur = useStableCallback(() => selectBackgroundEffect(backgroundBlur ? 'none' : 'blur'));

    // Called once the camera has been switched, so the effect follows the new device instead of
    // waiting for the publication event that a device swap does not always emit.
    const reapplyBackgroundEffect = useStableCallback(async (isCameraEnabled: boolean) => {
        if (!isCameraEnabled || !hasLiveCameraTrack(room)) {
            return;
        }

        if (backgroundBlur && backgroundBlurProcessorInstanceRef.current) {
            // Prevent the localTrackPublished handler from also trying to attach the processor
            preventAutoApplyingBlur.current = true;

            // Use our guarded attachment to prevent concurrent initializations
            await attachBackgroundBlurProcessor();
        } else if (hasImageBackground && customBackgroundProcessorInstanceRef.current) {
            preventAutoApplyingBlur.current = true;

            await attachCustomBackgroundProcessor();
        }
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
            } else if (hasImageBackground && customBackgroundProcessorInstanceRef.current) {
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
    }, [localParticipant, backgroundBlur, hasImageBackground]);

    useEffect(() => {
        if (!isBackgroundEffectsSupported) {
            return;
        }

        let cancelled = false;

        const creation = createBackgroundProcessor();
        backgroundBlurProcessorCreationRef.current = creation;

        void (async () => {
            const processor = await creation;

            if (cancelled) {
                processor?.disable?.();
                void processor?.destroy?.();
                return;
            }

            backgroundBlurProcessorInstanceRef.current = processor;
        })();

        return () => {
            cancelled = true;
            backgroundBlurProcessorCreationRef.current = null;
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            void backgroundBlurProcessorInstanceRef.current?.destroy?.();
        };
    }, [isBackgroundEffectsSupported]);

    // Warms the processor for the restored background, so the first camera frame already has it.
    useEffect(() => {
        if (!canApplyImageBackground || !hasImageBackground) {
            return;
        }

        const restoredEffect = selectAppliedBackgroundEffect(store.getState());

        void (async () => {
            const source = await resolveBackgroundSource(restoredEffect);

            if (source) {
                await ensureCustomBackgroundProcessor(source);
            }
        })();
    }, [canApplyImageBackground, ensureCustomBackgroundProcessor, hasImageBackground, store]);

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

    return {
        selectBackgroundEffect,
        toggleBackgroundBlur: debouncedToggleBackgroundBlur,
        reapplyBackgroundEffect,
        trackBackgroundEffectInitialization,
        cancelBackgroundEffectInitialization,
    };
};
