import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { IcMeetUser } from '@proton/icons';

interface VideoPreviewProps {
    isCameraEnabled: boolean;
    hasCameraPermission: boolean;
    selectedCameraId: string;
}

export const VideoPreview = ({ isCameraEnabled, hasCameraPermission, selectedCameraId }: VideoPreviewProps) => {
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleCameraToggle = useCallback(async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (!isCameraEnabled) {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
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
    }, [isCameraEnabled, selectedCameraId]);

    useEffect(() => {
        void handleCameraToggle();
        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [handleCameraToggle]);

    if (!isCameraEnabled) {
        return (
            <div
                className="w-full h-full flex justify-center items-center"
                style={{ color: 'var(--interaction-weak)' }}
            >
                {!hasCameraPermission && (
                    <IcMeetUser
                        className="w-custom h-custom"
                        style={{ '--w-custom': '155px', '--h-custom': '155px' }}
                        viewBox="0 0 146 156"
                    />
                )}
                <div className="color-weak">{hasCameraPermission && c('Meet').t`Camera is off`}</div>
            </div>
        );
    }

    return (
        <video
            className="w-full"
            ref={videoRef}
            autoPlay
            playsInline
            style={{ objectFit: 'contain', background: '#000' }}
        />
    );
};
