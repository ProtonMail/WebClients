import { useEffect, useRef } from 'react';
import type { CanvasConfig, Stroke } from './types';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useDrawing } from './hooks/useDrawing';
import './Canvas.scss';

interface CanvasProps {
    config: CanvasConfig;
    strokes: Stroke[];
    currentColor: string;
    strokeWidth: number;
    onStrokeComplete: (stroke: Stroke) => void;
    embedded?: boolean;
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const Canvas = ({
    config,
    strokes,
    currentColor,
    strokeWidth,
    onStrokeComplete,
    embedded = false,
}: CanvasProps) => {
    const width = config.width ?? DEFAULT_WIDTH;
    const height = config.height ?? DEFAULT_HEIGHT;

    const { canvasRef, isLoading, error, drawTemporaryStroke, render } = useCanvasRenderer({
        width,
        height,
        baseImage: config.baseImage,
        strokes,
    });

    const { isDrawing, startDrawing, continueDrawing, stopDrawing, cancelDrawing } = useDrawing({
        color: currentColor,
        strokeWidth,
        onStrokeComplete,
    });

    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse event handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleMouseDown = (e: MouseEvent) => {
            startDrawing(e, canvas);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const stroke = continueDrawing(e, canvas);
            if (stroke) {
                drawTemporaryStroke(stroke);
            }
        };

        const handleMouseUp = () => {
            stopDrawing();
        };

        const handleMouseLeave = () => {
            if (isDrawing) {
                cancelDrawing();
                render();
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [canvasRef, startDrawing, continueDrawing, stopDrawing, cancelDrawing, isDrawing, drawTemporaryStroke, render]);

    // Touch event handlers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTouchStart = (e: TouchEvent) => {
            startDrawing(e, canvas);
        };

        const handleTouchMove = (e: TouchEvent) => {
            const stroke = continueDrawing(e, canvas);
            if (stroke) {
                drawTemporaryStroke(stroke);
            }
        };

        const handleTouchEnd = () => {
            stopDrawing();
        };

        const handleTouchCancel = () => {
            cancelDrawing();
            render();
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchCancel);

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchCancel);
        };
    }, [canvasRef, startDrawing, continueDrawing, stopDrawing, cancelDrawing, drawTemporaryStroke, render]);

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={[
                'canvas flex items-center justify-center',
                embedded ? 'canvas--embedded w-full' : 'w-full h-full p-12',
            ].join(' ')}
        >
            {isLoading && (
                <div className="canvas__loading-overlay absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="canvas__loading-spinner inline-block rounded-full" />
                        <p className="mt-2 color-norm">Loading image...</p>
                    </div>
                </div>
            )}
            {embedded ? (
                <div className="image-preview-image-frame">
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="canvas__element canvas__element--embedded block"
                    />
                </div>
            ) : (
                <canvas ref={canvasRef} width={width} height={height} className="canvas__element block" />
            )}
        </div>
    );
};
