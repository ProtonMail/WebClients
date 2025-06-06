import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import './VideoPreview.scss';

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
                className="w-full h-full flex flex-column justify-center items-center gap-2"
                style={{ color: 'var(--interaction-weak)' }}
            >
                {!hasCameraPermission && (
                    <div
                        className={clsx('color-norm rounded-full px-4 py-2 mb-8 mt-8 border-none', 'allow-button')}
                        onClick={noop}
                    >
                        {c('l10n_nightly Action').t`Allow microphone and camera`}
                    </div>
                )}
                <div className="color-weak">{hasCameraPermission && c('l10n_nightly Info').t`Camera is off`}</div>
            </div>
        );
    }

    return (
        <video
            className="w-full"
            ref={videoRef}
            autoPlay
            playsInline
            style={{ objectFit: 'contain', background: '#000', transform: 'scaleX(-1)' }}
        />
    );
};
