import { useCallback, useEffect, useRef } from 'react';

import type { LocalVideoTrack, Room } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { resolveBackgroundSource } from '@proton/meet/utils/customBackgrounds';
import type { VirtualBackgroundSource } from '@proton/meet/utils/virtualBackgrounds';
import { isChrome, isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    createBackgroundProcessor,
    createCustomBackgroundProcessor,
    ensureBackgroundProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';
import type {
    BackgroundBlurProcessor,
    BackgroundProcessorVersion,
    CustomBackgroundProcessor,
} from '../../processors/background-processor/types';
import type { BackgroundEffectInitializationTracker } from '../BackgroundEffects/useBackgroundEffectInitializationTracker';

interface UseCameraPreviewParams {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
    isBackgroundBlurSupported: boolean;
    backgroundEffect: BackgroundEffect;
    backgroundProcessorVersion: BackgroundProcessorVersion;
    room: Room;
    trackBackgroundEffectInitialization: BackgroundEffectInitializationTracker['trackBackgroundEffectInitialization'];
    cancelBackgroundEffectInitialization: BackgroundEffectInitializationTracker['cancelBackgroundEffectInitialization'];
}

export const useCameraPreview = ({
    selectedCameraId,
    facingMode,
    isBackgroundBlurSupported,
    backgroundEffect,
    backgroundProcessorVersion,
    room,
    trackBackgroundEffectInitialization,
    cancelBackgroundEffectInitialization,
}: UseCameraPreviewParams) => {
    const previewTrackRef = useRef<LocalVideoTrack | null>(null);
    const previewEffectInitTokenRef = useRef<number | undefined>(undefined);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);
    const backgroundProcessorCreationRequestIdRef = useRef(0);

    const customBackgroundProcessorInstanceRef = useRef<CustomBackgroundProcessor | null>(null);
    const customBackgroundProcessorCreationRef = useRef<Promise<CustomBackgroundProcessor | null> | null>(null);

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

    const isPreviewProcessor = (processor: unknown) =>
        !!processor &&
        (processor === backgroundBlurProcessorInstanceRef.current ||
            processor === customBackgroundProcessorInstanceRef.current);

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

    const ensurePreviewBlurProcessor = useCallback(async () => {
        if (backgroundBlurProcessorInstanceRef.current) {
            return backgroundBlurProcessorInstanceRef.current;
        }

        const requestId = ++backgroundProcessorCreationRequestIdRef.current;
        const processor = await createBackgroundProcessor(false, backgroundProcessorVersion);

        if (requestId !== backgroundProcessorCreationRequestIdRef.current) {
            // Deps changed while awaiting: discard this now-stale processor.
            void processor?.destroy?.();
            return null;
        }

        backgroundBlurProcessorInstanceRef.current = processor;

        return processor;
    }, [backgroundProcessorVersion]);

    const ensurePreviewCustomBackgroundProcessor = useCallback(async (source: VirtualBackgroundSource) => {
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
    }, []);

    const applyPreviewBackgroundEffect = useCallback(
        async (effect: BackgroundEffect) => {
            const videoTrack = previewTrackRef.current;

            if (!videoTrack) {
                return;
            }

            if (effect === 'none') {
                backgroundBlurProcessorInstanceRef.current?.disable?.();
                customBackgroundProcessorInstanceRef.current?.disable?.();
                cancelPreviewEffectInitialization();
                return;
            }

            if (effect === 'blur') {
                const blurProcessor = await ensurePreviewBlurProcessor();

                // The preview was torn down or restarted while the processor was loading.
                if (!blurProcessor || previewTrackRef.current !== videoTrack) {
                    return;
                }

                customBackgroundProcessorInstanceRef.current?.disable?.();

                const processor = await ensureBackgroundProcessor(videoTrack, blurProcessor);
                processor?.enable?.();

                if (processor?.waitUntilBlurApplied) {
                    const { waitUntilBlurApplied } = processor;
                    previewEffectInitTokenRef.current = trackBackgroundEffectInitialization('blur', () =>
                        waitUntilBlurApplied()
                    );
                }

                return;
            }

            const source = await resolveBackgroundSource(effect);

            if (!source || previewTrackRef.current !== videoTrack) {
                return;
            }

            const customProcessor = await ensurePreviewCustomBackgroundProcessor(source);

            if (!customProcessor || previewTrackRef.current !== videoTrack) {
                return;
            }

            backgroundBlurProcessorInstanceRef.current?.disable?.();

            const processor = await ensureBackgroundProcessor(videoTrack, customProcessor);
            processor?.enable?.();

            if (processor?.waitUntilBackgroundApplied) {
                const { waitUntilBackgroundApplied } = processor;
                previewEffectInitTokenRef.current = trackBackgroundEffectInitialization('virtualBackground', () =>
                    waitUntilBackgroundApplied()
                );
            }
        },
        [
            cancelPreviewEffectInitialization,
            ensurePreviewBlurProcessor,
            ensurePreviewCustomBackgroundProcessor,
            trackBackgroundEffectInitialization,
        ]
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

        const processors = [backgroundBlurProcessorInstanceRef.current, customBackgroundProcessorInstanceRef.current];

        backgroundBlurProcessorInstanceRef.current = null;
        customBackgroundProcessorInstanceRef.current = null;
        customBackgroundProcessorCreationRef.current = null;

        for (const processor of processors) {
            try {
                await processor?.destroy();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }
    };

    const handlePreviewCameraToggle = (videoElement: HTMLVideoElement) =>
        enqueuePreviewLifecycleOperation(() => startPreviewTrack(videoElement));

    const cleanupPreviewTrack = () => enqueuePreviewLifecycleOperation(stopPreviewTrack);

    const cleanupCameraPreview = () => enqueuePreviewLifecycleOperation(releaseCameraPreview);

    const handlePreviewBackgroundEffectUpdate = useCallback(async () => {
        if (!isBackgroundBlurSupported) {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            customBackgroundProcessorInstanceRef.current?.disable?.();
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
