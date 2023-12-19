/* eslint-disable jsx-a11y/media-has-caption */
import React, { useEffect, useRef } from 'react';

import jsQR, { QRCode } from 'jsqr';
import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';

interface Props {
    onScan: (qrcode: QRCode) => void;
    onError?: () => void;
}

const QRCodeReader = ({ onScan, onError }: Props) => {
    const { createNotification } = useNotifications();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const video = videoRef.current;

        const onLoadedMetadata = () => {
            const scanQRCode = () => {
                const context = canvasRef.current?.getContext('2d');
                if (!context || !videoRef.current || !canvasRef.current) {
                    return;
                }

                const { videoWidth, videoHeight } = videoRef.current;

                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;

                context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);

                if (videoWidth > 0 && videoHeight > 0) {
                    const imageData = context.getImageData(0, 0, videoWidth, videoHeight);

                    const code = jsQR(imageData.data, videoWidth, videoHeight);

                    if (code) {
                        onScan(code);
                    }
                }

                requestAnimationFrame(scanQRCode);
            };

            scanQRCode();
        };

        const handleSuccess = (stream: MediaStream) => {
            if (!videoRef.current || !canvasRef.current) {
                return null;
            }

            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        };

        const handleError = (error: unknown) => {
            createNotification({ text: c('QRCode Reader').t`Could not run QR code reader` });
            console.error('handleError', error);
            onError?.();
        };

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' } })
            .then(handleSuccess)
            .catch(handleError);

        // Cleanup function
        return () => {
            const stream = video?.srcObject as MediaStream;
            video?.removeEventListener('loadedmetadata', onLoadedMetadata);

            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, [createNotification, onError, onScan]);

    return (
        <div>
            <video ref={videoRef} autoPlay playsInline className="w-custom" style={{ '--w-custom': '100%' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default QRCodeReader;
