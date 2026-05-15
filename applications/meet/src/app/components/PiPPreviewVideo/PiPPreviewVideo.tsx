import { useEffect, useRef, useState } from 'react';

import { Feedback } from '@dnd-kit/dom';
import { DragDropProvider, type DragEndEvent, useDraggable } from '@dnd-kit/react';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcDots } from '@proton/icons/icons/IcDots';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import clsx from '@proton/utils/clsx';

import { PIP_PREVIEW_ITEM_HEIGHT, PIP_PREVIEW_ITEM_WIDTH } from '../../constants';

import './PiPPreviewVideo.scss';

interface PiPPreviewVideoProps {
    canvas: HTMLCanvasElement | null;
    onClose?: () => void;
    tracksLength: number;
}

const CONTROL_BAR_HEIGHT = 24;

const PiPPreviewVideoInternal = ({
    canvas,
    onClose,
    tracksLength,
    position,
}: PiPPreviewVideoProps & { position: { x: number; y: number } }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isInPipMode, setIsInPipMode] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { ref, isDragging } = useDraggable({
        id: 'draggable',
    });

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClose?.();
    };

    const toggleMinimize = () => {
        setIsMinimized((prev) => !prev);
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

    const height = (tracksLength * baseWidth) / (PIP_PREVIEW_ITEM_WIDTH / PIP_PREVIEW_ITEM_HEIGHT) + CONTROL_BAR_HEIGHT;

    return (
        <div
            className={clsx(
                'fixed z-up bottom-custom right-custom overflow-hidden w-custom h-custom',
                isInPipMode ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
            style={{
                '--bottom-custom': '1rem',
                '--right-custom': '1rem',
                '--w-custom': `${baseWidth}px`,
                '--h-custom': `${isMinimized ? CONTROL_BAR_HEIGHT : height}px`,
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            ref={ref}
        >
            <div className="border-0 p-0 m-0 rounded-lg relative overflow-hidden" style={{ width: baseWidth, height }}>
                {!isInPipMode && (
                    <div
                        className={clsx(
                            'pip-background flex items-center justify-end flex-row px-2',
                            isMinimized && 'rounded-lg'
                        )}
                    >
                        <div className="flex-auto">
                            <IcDots size={3} />
                        </div>
                        <Button
                            type="button"
                            onClick={toggleMinimize}
                            className="rounded-full"
                            aria-label="Minimize preview"
                            shape="ghost"
                            size="small"
                            icon
                        >
                            {isMinimized ? <IcPlus size={2.5} /> : <IcMinus size={2.5} />}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleClose}
                            className="rounded-full"
                            aria-label="Close preview"
                            shape="ghost"
                            size="small"
                            icon
                        >
                            <IcCross size={3} />
                        </Button>
                    </div>
                )}
                <div className="inset-0 overflow-hidden">
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
            </div>
        </div>
    );
};

export const PiPPreviewVideo = ({ canvas, onClose, tracksLength }: PiPPreviewVideoProps) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleDragEnd: DragEndEvent = (event) => {
        if (!event.canceled) {
            setPosition((prev) => ({
                x: prev.x + event.operation.transform.x,
                y: prev.y + event.operation.transform.y,
            }));
        }
    };

    return (
        <DragDropProvider
            onDragEnd={handleDragEnd}
            plugins={(defaults) => [
                ...defaults.filter((p) => p !== Feedback),
                Feedback.configure({ dropAnimation: null }),
            ]}
        >
            <PiPPreviewVideoInternal
                canvas={canvas}
                onClose={onClose}
                tracksLength={tracksLength}
                position={position}
            />
        </DragDropProvider>
    );
};
