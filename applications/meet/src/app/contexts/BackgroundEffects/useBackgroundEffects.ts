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
import { useFlag } from '@proton/unleash/useFlag';

import { useStableCallback } from '../../hooks/useStableCallback';
import {
    createBackgroundProcessor,
    ensureBackgroundProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundProcessor } from '../../processors/background-processor/types';
import { getCurrentCameraTrack, hasLiveCameraTrack } from '../../utils/cameraTrack';
import { resolveBackgroundMode } from './resolveBackgroundMode';
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

    // Presets and custom uploads share one mode, so reattaching doesn't care which kind it is.
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
    const backgroundSelectionGenerationRef = useRef(0);

    const preventAutoApplyingBlur = useRef(false);

    // Blur and image backgrounds are modes of this one processor, so switching
    // between them never rebuilds the segmentation pipeline.
    const processorInstanceRef = useRef<BackgroundProcessor | null>(null);
    const processorCreationRef = useRef<Promise<BackgroundProcessor | null> | null>(null);

    const isProcessorAttached = (processor: BackgroundProcessor | null) =>
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

    const attachProcessor = useStableCallback(
        async (initializingEffect: InitializingBackgroundEffect, instance?: BackgroundProcessor | null) => {
            if (processorAttachInProgress.current) {
                return ATTACH_SKIPPED;
            }

            processorAttachInProgress.current = true;

            const processorToAttach = instance ?? processorInstanceRef.current;
            const videoTrack = getCurrentCameraTrack(room);
            const isSwappingProcessor = !isProcessorAttached(processorToAttach);

            try {
                return await withBlankedRawFrames(videoTrack, isSwappingProcessor, async () => {
                    const result = await ensureBackgroundProcessor(videoTrack, processorToAttach);

                    result?.enable?.();

                    // A mode switch is live on the next frame, so reporting it would flash
                    // the initializing overlay. Only a real warmup is worth naming.
                    if (result && !result.hasAppliedMask()) {
                        trackBackgroundEffectInitialization(initializingEffect, () => result.waitUntilApplied());
                    }

                    return result;
                });
            } finally {
                processorAttachInProgress.current = false;
            }
        }
    );

    const abandonBackgroundEffects = useStableCallback((failedEffect: InitializingBackgroundEffect) => {
        processorInstanceRef.current?.disable?.();
        reportBackgroundEffectFailure(failedEffect);
        dispatch(applyBackgroundEffectAndPersist('none'));
    });

    const failRestoredBackground = useStableCallback((error: unknown) => {
        reportError('Failed to warm up the restored virtual background', error);
        abandonBackgroundEffects('virtualBackground');
    });

    const ensureProcessorInstance = useStableCallback(async () => {
        if (processorInstanceRef.current) {
            return processorInstanceRef.current;
        }

        const creation = processorCreationRef.current;
        const processor = await creation;

        return processorCreationRef.current === creation ? processor : null;
    });

    const applyBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        if (effect === 'none') {
            processorInstanceRef.current?.disable?.();
            cancelBackgroundEffectInitialization();
            dispatch(applyBackgroundEffectAndPersist(effect));
            return;
        }

        const isBlur = effect === 'blur';

        if (!isBlur && !canApplyImageBackground) {
            return;
        }

        const mode = await resolveBackgroundMode(effect);

        if (!mode) {
            reportError('The virtual background source is unavailable', { context: { effect } });
            return;
        }

        // The processor is still loading when an effect is picked right after landing on the page.
        const processor = await ensureProcessorInstance();

        if (!processor) {
            reportError('The background processor is unavailable', { context: { effect } });
            return;
        }

        await processor.setMode(mode);

        if (hasLiveCameraTrack(room)) {
            const initializingEffect: InitializingBackgroundEffect = isBlur ? 'blur' : 'virtualBackground';
            const attached = await attachProcessor(initializingEffect, processor);

            if (!attached) {
                reportError('Failed to attach the background processor', { context: { effect } });
                abandonBackgroundEffects(initializingEffect);
                return;
            }

            if (attached !== ATTACH_SKIPPED) {
                attached.enable?.();
            }
        }

        dispatch(applyBackgroundEffectAndPersist(effect));
    });

    const selectBackgroundEffect = useStableCallback(async (effect: BackgroundEffect) => {
        backgroundSelectionGenerationRef.current += 1;
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
        if (!isCameraEnabled || !hasLiveCameraTrack(room) || !processorInstanceRef.current) {
            return;
        }

        if (!backgroundBlur && !hasImageBackground) {
            return;
        }

        // Prevent the localTrackPublished handler from also trying to attach the processor
        preventAutoApplyingBlur.current = true;

        // Use our guarded attachment to prevent concurrent initializations
        await attachProcessor(backgroundBlur ? 'blur' : 'virtualBackground');
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
                preventAutoApplyingBlur.current ||
                !processorInstanceRef.current ||
                (!backgroundBlur && !hasImageBackground)
            ) {
                return;
            }

            preventAutoApplyingBlur.current = true;

            const processor = await attachProcessor(backgroundBlur ? 'blur' : 'virtualBackground');

            if (processor !== ATTACH_SKIPPED) {
                processor?.enable();
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
        processorCreationRef.current = creation;

        void (async () => {
            const processor = await creation;

            if (cancelled) {
                processor?.disable?.();
                void processor?.destroy?.();
                return;
            }

            processorInstanceRef.current = processor;
        })();

        return () => {
            cancelled = true;
            processorCreationRef.current = null;
            processorInstanceRef.current?.disable?.();
            void processorInstanceRef.current?.destroy?.();
        };
    }, [isBackgroundEffectsSupported]);

    // Warms the processor for the restored background, so the first camera frame already has it.
    useEffect(() => {
        if (!canApplyImageBackground || !hasImageBackground) {
            return;
        }

        const restoredEffect = selectAppliedBackgroundEffect(store.getState());
        const selectionGeneration = backgroundSelectionGenerationRef.current;
        let cancelled = false;

        void (async () => {
            try {
                const source = await resolveBackgroundSource(restoredEffect);

                // Resolving a custom background can involve cache decryption or a download.
                // Do not let that stale warmup overwrite a choice made in the meantime.
                if (cancelled || !source || selectionGeneration !== backgroundSelectionGenerationRef.current) {
                    return;
                }

                const processor = await ensureProcessorInstance();

                if (cancelled || selectionGeneration !== backgroundSelectionGenerationRef.current) {
                    return;
                }

                await processor?.setMode({ type: 'image', ...source });
            } catch (error) {
                if (cancelled || selectionGeneration !== backgroundSelectionGenerationRef.current) {
                    return;
                }
                failRestoredBackground(error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [canApplyImageBackground, ensureProcessorInstance, failRestoredBackground, hasImageBackground, store]);

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
