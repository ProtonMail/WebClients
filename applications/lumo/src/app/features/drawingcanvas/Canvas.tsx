import { useEffect, useRef } from 'react';
import type { CanvasConfig, Stroke } from './types';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useDrawing } from './hooks/useDrawing';

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
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem',
                boxSizing: 'border-box',
            }}
        >
            {isLoading && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0, left: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 10,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                display: 'inline-block',
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                borderBottom: '2px solid var(--primary)',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-norm)' }}>Loading image...</p>
                    </div>
                </div>
            )}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    display: 'block',
                    touchAction: 'none',
                    cursor: 'crosshair',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '1.5rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
            />
        </div>
    );
};
