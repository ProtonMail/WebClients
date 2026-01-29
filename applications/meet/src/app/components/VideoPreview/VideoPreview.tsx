import { useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { createLocalVideoTrack } from 'livekit-client';
import type { LocalVideoTrack } from 'livekit-client';

import { isChrome, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useMediaManagementContext } from '../../contexts/MediaManagementContext';
import {
    createBackgroundProcessor,
    ensureBackgroundBlurProcessor,
} from '../../processors/background-processor/createBackgroundProcessor';

import './VideoPreview.scss';

const backgroundBlurProcessorInstance = createBackgroundProcessor();

interface VideoPreviewProps {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
}

export const VideoPreview = ({ selectedCameraId, facingMode }: VideoPreviewProps) => {
    const trackRef = useRef<LocalVideoTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const processorAttachInProgress = useRef(false);

    const { isBackgroundBlurSupported, backgroundBlur } = useMediaManagementContext();

    const room = useRoomContext();

    const applyBackgroundBlurPreference = async (enable: boolean) => {
        const videoTrack = trackRef.current;

        if (!backgroundBlurProcessorInstance || !videoTrack || !enable) {
            backgroundBlurProcessorInstance?.disable?.();
            return;
        }

        if (processorAttachInProgress.current) {
            return;
        }

        processorAttachInProgress.current = true;
        try {
            const processor = await ensureBackgroundBlurProcessor(videoTrack, backgroundBlurProcessorInstance);
            processor?.enable?.();
        } finally {
            processorAttachInProgress.current = false;
        }
    };

    useEffect(() => {
        const cleanupTrack = async () => {
            const track = trackRef.current;
            if (!track) {
                return;
            }

            trackRef.current = null;

            try {
                if (track.getProcessor() === backgroundBlurProcessorInstance) {
                    await track.stopProcessor();
                }
            } catch {
                // ignore processor stop errors during cleanup
            } finally {
                track.stop();
            }
        };

        const handleCameraToggle = async () => {
            await cleanupTrack();

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

                if (videoRef.current && videoTrack) {
                    videoTrack.attach(videoRef.current);
                    trackRef.current = videoTrack;

                    if (isBackgroundBlurSupported && backgroundBlur) {
                        await applyBackgroundBlurPreference(true);
                    } else {
                        backgroundBlurProcessorInstance?.disable?.();
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

                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                }
            }
        };

        const cleanup = async () => {
            await cleanupTrack();
            backgroundBlurProcessorInstance?.disable?.();
        };

        void handleCameraToggle();

        return () => {
            void cleanup();
        };
    }, [selectedCameraId, facingMode]);

    useEffect(() => {
        if (!isBackgroundBlurSupported) {
            backgroundBlurProcessorInstance?.disable?.();
            return;
        }

        void applyBackgroundBlurPreference(backgroundBlur);

        return () => {
            if (!backgroundBlur) {
                backgroundBlurProcessorInstance?.disable?.();
            }
        };
    }, [backgroundBlur, isBackgroundBlurSupported]);

    return (
        <>
            <div className="h-full w-full relative overflow-hidden">
                <div
                    className="gradient-overlay absolute top-0 left-0 w-full h-full z-custom"
                    style={{ '--z-custom': '2' }}
                />
                {/* This is just a video preview of the user's camera, so we don't need a caption */}
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                    className="absolute h-full w-full lg:w-full"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        objectFit: 'cover',
                        background: '#000',
                        transform:
                            (isSafari() || facingMode === 'environment') && isMobile() ? undefined : 'scaleX(-1)',
                    }}
                />
            </div>
        </>
    );
};
