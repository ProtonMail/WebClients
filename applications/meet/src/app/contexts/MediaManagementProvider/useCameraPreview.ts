import { useCallback, useEffect, useRef } from 'react';

import type { LocalVideoTrack, Room } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import { isChrome, isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundBlurProcessor, BackgroundProcessorVersion } from '../../processors/background-processor/types';
import type { BlurInitializationState } from './useBlurInitializationState';

interface UseCameraPreviewParams {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
    isBackgroundBlurSupported: boolean;
    backgroundBlur: boolean;
    backgroundProcessorVersion: BackgroundProcessorVersion;
    room: Room;
    trackBlurInitialization: BlurInitializationState['trackBlurInitialization'];
    cancelBlurInitialization: BlurInitializationState['cancelBlurInitialization'];
}

export const useCameraPreview = ({
    selectedCameraId,
    facingMode,
    isBackgroundBlurSupported,
    backgroundBlur,
    backgroundProcessorVersion,
    room,
    trackBlurInitialization,
    cancelBlurInitialization,
}: UseCameraPreviewParams) => {
    const previewTrackRef = useRef<LocalVideoTrack | null>(null);
    const processorAttachInProgress = useRef(false);
    const previewBlurInitTokenRef = useRef<number | undefined>(undefined);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);
    const backgroundProcessorCreationRequestIdRef = useRef(0);

    const cancelPreviewBlurInitialization = useCallback(() => {
        if (previewBlurInitTokenRef.current === undefined) {
            return;
        }
        cancelBlurInitialization(previewBlurInitTokenRef.current);
        previewBlurInitTokenRef.current = undefined;
    }, [cancelBlurInitialization]);

    const cleanupPreviewTrack = async () => {
        cancelPreviewBlurInitialization();

        const track = previewTrackRef.current;
        if (!track) {
            return;
        }

        previewTrackRef.current = null;

        try {
            if (track.getProcessor() === backgroundBlurProcessorInstanceRef.current) {
                await track.stopProcessor();
            }
        } catch {
            // ignore processor stop errors during cleanup
        } finally {
            track.stop();
            track.detach();
        }
    };

    const applyPreviewBackgroundBlurPreference = useCallback(
        async (enable: boolean) => {
            const videoTrack = previewTrackRef.current;

            if (!backgroundBlurProcessorInstanceRef.current) {
                const requestId = ++backgroundProcessorCreationRequestIdRef.current;
                const processor = await createBackgroundProcessor(false, backgroundProcessorVersion);

                if (requestId !== backgroundProcessorCreationRequestIdRef.current) {
                    // Deps changed while awaiting: discard this now-stale processor.
                    void processor?.destroy?.();
                    return;
                }

                backgroundBlurProcessorInstanceRef.current = processor;
            }

            if (!backgroundBlurProcessorInstanceRef.current || !videoTrack || !enable) {
                backgroundBlurProcessorInstanceRef.current?.disable?.();
                cancelPreviewBlurInitialization();
                return;
            }

            if (processorAttachInProgress.current) {
                return;
            }

            processorAttachInProgress.current = true;
            try {
                const processor = await ensureBackgroundBlurProcessor(
                    videoTrack,
                    backgroundBlurProcessorInstanceRef.current
                );
                processor?.enable?.();

                if (processor?.waitUntilBlurApplied) {
                    const { waitUntilBlurApplied } = processor;
                    previewBlurInitTokenRef.current = trackBlurInitialization(() => waitUntilBlurApplied());
                }
            } finally {
                processorAttachInProgress.current = false;
            }
        },
        [backgroundProcessorVersion, trackBlurInitialization, cancelPreviewBlurInitialization]
    );

    const handlePreviewCameraToggle = async (videoElement: HTMLVideoElement) => {
        await cleanupPreviewTrack();

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

            if (videoElement && videoTrack) {
                videoTrack.attach(videoElement);
                previewTrackRef.current = videoTrack;

                if (isBackgroundBlurSupported && backgroundBlur) {
                    await applyPreviewBackgroundBlurPreference(true);
                } else {
                    backgroundBlurProcessorInstanceRef.current?.disable?.();
                }
            }
        };

        try {
            await executeToggle(deviceIdToUse);
        } catch (e) {
            const fallbackDeviceId = room.localParticipant.activeDeviceMap.get('videoinput');

            try {
                await wait(100);
                await executeToggle(fallbackDeviceId);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(fallbackDeviceId, e);

                if (videoElement) {
                    videoElement.srcObject = null;
                }
            }
        }
    };

    const cleanupCameraPreview = async () => {
        await cleanupPreviewTrack();

        if (backgroundBlurProcessorInstanceRef.current) {
            try {
                await backgroundBlurProcessorInstanceRef.current.destroy();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            } finally {
                backgroundBlurProcessorInstanceRef.current = null;
            }
        }
    };

    const handlePreviewBackgroundBlurPreferenceUpdate = useCallback(async () => {
        if (!isBackgroundBlurSupported) {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            return;
        }

        void applyPreviewBackgroundBlurPreference(backgroundBlur);
    }, [applyPreviewBackgroundBlurPreference, backgroundBlur, isBackgroundBlurSupported]);

    useEffect(() => {
        void handlePreviewBackgroundBlurPreferenceUpdate();
    }, [handlePreviewBackgroundBlurPreferenceUpdate]);

    return {
        handlePreviewCameraToggle,
        cleanupCameraPreview,
        handlePreviewBackgroundBlurPreferenceUpdate,
        cleanupPreviewTrack,
    };
};
