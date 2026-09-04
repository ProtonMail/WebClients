import { useCallback, useEffect, useRef } from 'react';

import type { LocalVideoTrack, Room } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { isChrome, isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    createBackgroundProcessor,
    ensureBackgroundProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundMode, BackgroundProcessor } from '../../processors/background-processor/types';
import { resolveBackgroundMode } from '../BackgroundEffects/resolveBackgroundMode';
import type { BackgroundEffectInitializationTracker } from '../BackgroundEffects/useBackgroundEffectInitializationTracker';

interface UseCameraPreviewParams {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
    isBackgroundBlurSupported: boolean;
    backgroundEffect: BackgroundEffect;
    room: Room;
    trackBackgroundEffectInitialization: BackgroundEffectInitializationTracker['trackBackgroundEffectInitialization'];
    cancelBackgroundEffectInitialization: BackgroundEffectInitializationTracker['cancelBackgroundEffectInitialization'];
}

export const useCameraPreview = ({
    selectedCameraId,
    facingMode,
    isBackgroundBlurSupported,
    backgroundEffect,
    room,
    trackBackgroundEffectInitialization,
    cancelBackgroundEffectInitialization,
}: UseCameraPreviewParams) => {
    const previewTrackRef = useRef<LocalVideoTrack | null>(null);
    const previewEffectInitTokenRef = useRef<number | undefined>(undefined);

    const processorInstanceRef = useRef<BackgroundProcessor | null>(null);
    const backgroundProcessorCreationRequestIdRef = useRef(0);

    const previewEffectQueueRef = useRef<Promise<void>>(Promise.resolve());
    const pendingPreviewEffectRef = useRef<BackgroundEffect | null>(null);

    const previewLifecycleQueueRef = useRef<Promise<unknown>>(Promise.resolve());

    const enqueuePreviewLifecycleOperation = <T>(operation: () => Promise<T>): Promise<T> => {
        const run = () => operation();
        const result = previewLifecycleQueueRef.current.then(run, run);

        previewLifecycleQueueRef.current = result.catch(() => undefined);

        return result;
    };

    const cancelPreviewEffectInitialization = useCallback(() => {
        if (previewEffectInitTokenRef.current === undefined) {
            return;
        }
        cancelBackgroundEffectInitialization(previewEffectInitTokenRef.current);
        previewEffectInitTokenRef.current = undefined;
    }, [cancelBackgroundEffectInitialization]);

    const isPreviewProcessor = (processor: unknown) => !!processor && processor === processorInstanceRef.current;

    const stopPreviewTrack = async () => {
        cancelPreviewEffectInitialization();

        const track = previewTrackRef.current;
        if (!track) {
            return;
        }

        previewTrackRef.current = null;

        try {
            if (isPreviewProcessor(track.getProcessor())) {
                await track.stopProcessor();
            }
        } catch {
            // ignore processor stop errors during cleanup
        } finally {
            track.stop();
            track.detach();
        }
    };

    const ensurePreviewProcessor = useCallback(async (mode: BackgroundMode) => {
        if (processorInstanceRef.current) {
            await processorInstanceRef.current.setMode(mode);
            return processorInstanceRef.current;
        }

        const requestId = ++backgroundProcessorCreationRequestIdRef.current;
        const processor = await createBackgroundProcessor(mode);

        if (requestId !== backgroundProcessorCreationRequestIdRef.current) {
            // Deps changed while awaiting: discard this now-stale processor.
            void processor?.destroy?.();
            return null;
        }

        processorInstanceRef.current = processor;

        return processor;
    }, []);

    const applyPreviewBackgroundEffect = useCallback(
        async (effect: BackgroundEffect) => {
            const videoTrack = previewTrackRef.current;

            if (!videoTrack) {
                return;
            }

            if (effect === 'none') {
                processorInstanceRef.current?.disable?.();
                cancelPreviewEffectInitialization();
                return;
            }

            const mode = await resolveBackgroundMode(effect);

            if (!mode || previewTrackRef.current !== videoTrack) {
                return;
            }

            const previewProcessor = await ensurePreviewProcessor(mode);

            // The preview was torn down or restarted while the processor was loading.
            if (!previewProcessor || previewTrackRef.current !== videoTrack) {
                return;
            }

            const processor = await ensureBackgroundProcessor(videoTrack, previewProcessor);
            processor?.enable?.();

            // A mode switch is live on the next frame; only a real warmup is worth naming.
            if (processor && !processor.hasAppliedMask()) {
                previewEffectInitTokenRef.current = trackBackgroundEffectInitialization(
                    effect === 'blur' ? 'blur' : 'virtualBackground',
                    () => processor.waitUntilApplied()
                );
            }
        },
        [cancelPreviewEffectInitialization, ensurePreviewProcessor, trackBackgroundEffectInitialization]
    );

    const requestPreviewBackgroundEffect = useCallback(
        (effect: BackgroundEffect) => {
            pendingPreviewEffectRef.current = effect;

            previewEffectQueueRef.current = previewEffectQueueRef.current.then(async () => {
                const pending = pendingPreviewEffectRef.current;

                if (!pending) {
                    return;
                }

                pendingPreviewEffectRef.current = null;

                try {
                    await applyPreviewBackgroundEffect(pending);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error applying the preview background effect', error);
                }
            });

            return previewEffectQueueRef.current;
        },
        [applyPreviewBackgroundEffect]
    );

    const startPreviewTrack = async (videoElement: HTMLVideoElement) => {
        await stopPreviewTrack();

        const deviceIdToUse = isMobile() ? undefined : selectedCameraId;

        const executeToggle = async (deviceId?: string) => {
            const videoTrack = await createLocalVideoTrack({
                deviceId,
                facingMode,
                ...(isChrome() &&
                    !isMobile() && {
                        resolution: {
                            width: 3840,
                            height: 2160,
                            aspectRatio: 16 / 9,
                        },
                    }),
            });

            if (!videoElement || !videoTrack) {
                return false;
            }

            videoTrack.attach(videoElement);
            previewTrackRef.current = videoTrack;

            if (isBackgroundBlurSupported) {
                await requestPreviewBackgroundEffect(backgroundEffect);
            }

            return true;
        };

        try {
            return await executeToggle(deviceIdToUse);
        } catch (e) {
            const fallbackDeviceId = room.localParticipant.activeDeviceMap.get('videoinput');

            try {
                await wait(100);
                return await executeToggle(fallbackDeviceId);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(fallbackDeviceId, e);

                if (videoElement) {
                    videoElement.srcObject = null;
                }

                return false;
            }
        }
    };

    const releaseCameraPreview = async () => {
        await stopPreviewTrack();

        await previewEffectQueueRef.current;

        const processor = processorInstanceRef.current;

        processorInstanceRef.current = null;

        try {
            await processor?.destroy();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    const handlePreviewCameraToggle = (videoElement: HTMLVideoElement) =>
        enqueuePreviewLifecycleOperation(() => startPreviewTrack(videoElement));

    const cleanupPreviewTrack = () => enqueuePreviewLifecycleOperation(stopPreviewTrack);

    const cleanupCameraPreview = () => enqueuePreviewLifecycleOperation(releaseCameraPreview);

    const handlePreviewBackgroundEffectUpdate = useCallback(async () => {
        if (!isBackgroundBlurSupported) {
            processorInstanceRef.current?.disable?.();
            return;
        }

        await requestPreviewBackgroundEffect(backgroundEffect);
    }, [backgroundEffect, isBackgroundBlurSupported, requestPreviewBackgroundEffect]);

    useEffect(() => {
        void handlePreviewBackgroundEffectUpdate();
    }, [handlePreviewBackgroundEffectUpdate]);

    return {
        handlePreviewCameraToggle,
        cleanupCameraPreview,
        handlePreviewBackgroundEffectUpdate,
        cleanupPreviewTrack,
    };
};
