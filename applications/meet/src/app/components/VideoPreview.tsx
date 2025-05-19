import { useCallback, useEffect, useRef } from 'react';

interface VideoPreviewProps {
    isCameraEnabled: boolean;
}

export const VideoPreview = ({ isCameraEnabled }: VideoPreviewProps) => {
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleCameraToggle = useCallback(async () => {
        if (!isCameraEnabled) {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        streamRef.current = stream;
    }, [isCameraEnabled]);

    useEffect(() => {
        void handleCameraToggle();
    }, [handleCameraToggle]);

    return <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', background: '#000' }} />;
};
