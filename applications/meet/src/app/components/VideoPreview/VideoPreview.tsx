import { useCallback, useEffect, useRef } from 'react';

import './VideoPreview.scss';

interface VideoPreviewProps {
    selectedCameraId: string;
}

export const VideoPreview = ({ selectedCameraId }: VideoPreviewProps) => {
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleCameraToggle = useCallback(async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId }, facingMode: 'user' } : true,
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
    }, [selectedCameraId]);

    useEffect(() => {
        void handleCameraToggle();
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [handleCameraToggle]);

    return (
        <>
            <div className="gradient-overlay absolute top-0 left-0 w-full h-full" />
            <div className="h-full w-full relative overflow-hidden">
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
