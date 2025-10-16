import { useEffect, useRef } from 'react';

import { createLocalVideoTrack } from '@proton-meet/livekit-client';
import type { LocalVideoTrack } from '@proton-meet/livekit-client';

import { isChrome, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
    facingMode: 'environment' | 'user';
}

export const VideoPreview = ({ selectedCameraId, facingMode }: VideoPreviewProps) => {
    const trackRef = useRef<LocalVideoTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const handleCameraToggle = async () => {
            if (trackRef.current) {
                trackRef.current.stop();
                trackRef.current = null;
            }

            try {
                const videoTrack = await createLocalVideoTrack({
                    deviceId: isMobile() ? undefined : selectedCameraId || undefined,
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
                }
            } catch (e) {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        void handleCameraToggle();

        return () => {
            if (trackRef.current) {
                trackRef.current.stop();
                trackRef.current = null;
            }
        };
    }, [selectedCameraId, facingMode]);

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
