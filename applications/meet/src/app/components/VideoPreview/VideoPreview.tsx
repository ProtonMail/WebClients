import { useEffect, useRef } from 'react';

import { createLocalVideoTrack } from '@proton-meet/livekit-client';
import type { LocalVideoTrack } from '@proton-meet/livekit-client';

import { isChrome } from '@proton/shared/lib/helpers/browser';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
}

export const VideoPreview = ({ selectedCameraId }: VideoPreviewProps) => {
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
                    deviceId: selectedCameraId || undefined,
                    facingMode: 'user',
                    ...(isChrome() && {
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
    }, [selectedCameraId]);

    return (
        <>
            <div className="h-full w-full relative overflow-hidden">
                <div
                    className="gradient-overlay absolute top-0 left-0 w-full h-full z-custom"
                    style={{ '--z-custom': '2' }}
                />
                <video
                    className="absolute h-full w-full lg:h-auto lg:w-full"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        objectFit: 'cover',
                        background: '#000',
                        transform: 'scaleX(-1)',
                    }}
                />
            </div>
        </>
    );
};
