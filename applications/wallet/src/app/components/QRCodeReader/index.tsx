/* eslint-disable jsx-a11y/media-has-caption */
import { useEffect, useRef, useState } from 'react';

import type { QRCode } from 'jsqr';
import jsQR from 'jsqr';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Icon, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { isMobile } from '@proton/shared/lib/helpers/browser';

interface Props {
    onScan: (qrcode: QRCode) => void;
    onError?: (errorName: DOMException['name']) => void;
}

const QRCodeReader = ({ onScan, onError }: Props) => {
    const { createNotification } = useNotifications();
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [loadingCam, withLoadingCam] = useLoading();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleSwitchCamera = () => {
        if (facingMode === 'environment') {
            setFacingMode('user');
        } else {
            setFacingMode('environment');
        }
    };

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

        const handleError = (error: DOMException) => {
            if (error.name === 'NotAllowedError') {
                createNotification({
                    text: c('QRCode Reader')
                        .t`You need to grant camera permission to be able to activate QRCode scanner`,
                });
            } else if (error.name === 'NotFoundError') {
                createNotification({
                    text: c('QRCode Reader').t`Could not find an available camera on your device`,
                });
            } else {
                createNotification({ text: c('QRCode Reader').t`Could not run QR code reader` });
            }

            onError?.(error.name);
        };

        void withLoadingCam(
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: facingMode } })
                .then(handleSuccess)
                .catch(handleError)
        );

        // Cleanup function
        return () => {
            const stream = video?.srcObject as MediaStream;
            video?.removeEventListener('loadedmetadata', onLoadedMetadata);

            if (stream) {
                const tracks = stream.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, [createNotification, onError, onScan, withLoadingCam, facingMode]);

    return (
        <div>
            {loadingCam ? (
                <div className="py-6 flex color-primary flex-row items-center justify-center">
                    <CircleLoader className="mr-2" />
                    <span>{c('QRCode reader').t`Loading QRCode reader`}</span>
                </div>
            ) : null}

            <video ref={videoRef} autoPlay playsInline className="w-full" />
            <canvas ref={canvasRef} className="hidden" />
            {!loadingCam && isMobile() && (
                <Button icon shape="solid" onClick={() => handleSwitchCamera()}>
                    <span>
                        <Icon name={'camera'} size={5} />
                        <Icon name={'arrows-switch'} className={'ml-2'} size={5} />
                    </span>
                </Button>
            )}
        </div>
    );
};

export default QRCodeReader;
