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
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export const Canvas = ({
    config,
    strokes,
    currentColor,
    strokeWidth,
    onStrokeComplete,
}: CanvasProps) => {
    const width = config.width ?? DEFAULT_WIDTH;
    const height = config.height ?? DEFAULT_HEIGHT;

    const { canvasRef, isLoading, error, drawTemporaryStroke } = useCanvasRenderer({
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
    }, [canvasRef, startDrawing, continueDrawing, stopDrawing, cancelDrawing, isDrawing, drawTemporaryStroke]);

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
    }, [canvasRef, startDrawing, continueDrawing, stopDrawing, cancelDrawing, drawTemporaryStroke]);

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-danger">{error}</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center p-12">
            {isLoading && (
                <div className="canvas__loading-overlay absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="canvas__loading-spinner inline-block rounded-full" />
                        <p className="mt-2 color-norm">Loading image...</p>
                    </div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="canvas__element block"
            />
        </div>
    );
};
