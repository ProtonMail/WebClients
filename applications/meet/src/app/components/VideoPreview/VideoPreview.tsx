import { useEffect, useRef } from 'react';

import { isChrome } from '@proton/shared/lib/helpers/browser';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
}

export const VideoPreview = ({ selectedCameraId }: VideoPreviewProps) => {
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const handleCameraToggle = async () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: selectedCameraId
                        ? {
                              deviceId: { exact: selectedCameraId },
                              facingMode: 'user',
                              ...(isChrome()
                                  ? { width: { ideal: 3840 }, height: { ideal: 2160 }, aspectRatio: { ideal: 16 / 9 } }
                                  : {}),
                          }
                        : true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
            } catch (e) {
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        void handleCameraToggle();
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
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
