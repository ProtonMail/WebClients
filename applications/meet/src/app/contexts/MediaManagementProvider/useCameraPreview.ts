import { useEffect, useRef } from 'react';

import type { LocalVideoTrack, Room } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';

import { isChrome, isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { BackgroundBlurProcessor } from '../../processors/background-processor/MulticlassBackgroundProcessor';
import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';

interface UseCameraPreviewParams {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
    isBackgroundBlurSupported: boolean;
    backgroundBlur: boolean;
    room: Room;
}

export const useCameraPreview = ({
    selectedCameraId,
    facingMode,
    isBackgroundBlurSupported,
    backgroundBlur,
    room,
}: UseCameraPreviewParams) => {
    const previewTrackRef = useRef<LocalVideoTrack | null>(null);
    const processorAttachInProgress = useRef(false);

    const backgroundBlurProcessorInstanceRef = useRef<BackgroundBlurProcessor | null>(null);

    const cleanupPreviewTrack = async () => {
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

    const applyPreviewBackgroundBlurPreference = async (enable: boolean) => {
        const videoTrack = previewTrackRef.current;

        if (!backgroundBlurProcessorInstanceRef.current) {
            backgroundBlurProcessorInstanceRef.current = createBackgroundProcessor();
        }

        if (!backgroundBlurProcessorInstanceRef.current || !videoTrack || !enable) {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
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
        } finally {
            processorAttachInProgress.current = false;
        }
    };

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

    const handlePreviewBackgroundBlurPreferenceUpdate = async () => {
        if (!isBackgroundBlurSupported) {
            backgroundBlurProcessorInstanceRef.current?.disable?.();
            return;
        }

        void applyPreviewBackgroundBlurPreference(backgroundBlur);
    };

    useEffect(() => {
        void handlePreviewBackgroundBlurPreferenceUpdate();
    }, [backgroundBlur, isBackgroundBlurSupported]);

    return {
        handlePreviewCameraToggle,
        cleanupCameraPreview,
        handlePreviewBackgroundBlurPreferenceUpdate,
    };
};
