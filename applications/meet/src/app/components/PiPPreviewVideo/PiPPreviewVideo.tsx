import { useEffect, useRef, useState } from 'react';

import { Button } from '@proton/atoms';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

import { PIP_PREVIEW_ITEM_HEIGHT, PIP_PREVIEW_ITEM_WIDTH } from '../../constants';

interface PiPPreviewVideoProps {
    canvas: HTMLCanvasElement | null;
    onClose?: () => void;
    tracksLength: number;
}

export const PiPPreviewVideo = ({ canvas, onClose, tracksLength }: PiPPreviewVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInPipMode, setIsInPipMode] = useState(false);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose?.();
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !canvas) {
            return;
        }

        try {
            const stream = canvas.captureStream(30);

            video.srcObject = stream;

            void video.play();
        } catch (error) {
            // Logging error
            // eslint-disable-next-line no-console
            console.error('Failed to set up canvas stream:', error);
        }

        return () => {
            if (video.srcObject) {
                const tracks = (video.srcObject as MediaStream).getTracks();
                tracks.forEach((track) => track.stop());
                video.srcObject = null;
            }
        };
    }, [canvas]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        const handleEnterPip = () => {
            setIsInPipMode(true);
        };

        const handleLeavePip = () => {
            setIsInPipMode(false);
            void video.play();
        };

        video.addEventListener('enterpictureinpicture', handleEnterPip);
        video.addEventListener('leavepictureinpicture', handleLeavePip);

        return () => {
            video.removeEventListener('enterpictureinpicture', handleEnterPip);
            video.removeEventListener('leavepictureinpicture', handleLeavePip);
        };
    }, []);

    if (!canvas?.width || !canvas?.height) {
        return null;
    }

    const baseWidth = 300;

    const height = (tracksLength * baseWidth) / (PIP_PREVIEW_ITEM_WIDTH / PIP_PREVIEW_ITEM_HEIGHT);

    return (
        <div
            className={clsx(
                'fixed z-50 bottom-custom right-custom overflow-hidden w-custom h-custom',
                isInPipMode ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            )}
            style={{
                '--bottom-custom': '1rem',
                '--right-custom': '1rem',
                '--w-custom': `${baseWidth}px`,
                '--h-custom': `${height}px`,
            }}
        >
            <div className="border-0 p-0 m-0 rounded-lg bg-black relative" style={{ width: baseWidth, height }}>
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <video
                        ref={videoRef}
                        className="shadow-lg bg-black w-full h-full"
                        autoPlay
                        muted
                        playsInline
                        controls={false}
                        disablePictureInPicture={false}
                    />
                </div>
                {!isInPipMode && (
                    <Button
                        type="button"
                        onClick={handleClose}
                        className="absolute top-0 right-0 rounded-full w-custom h-custom"
                        style={{
                            '--w-custom': '2.5rem',
                            '--h-custom': '2.5rem',
                        }}
                        aria-label="Close preview"
                        shape="ghost"
                        icon
                    >
                        <IcCross size={5} />
                    </Button>
                )}
            </div>
        </div>
    );
};
