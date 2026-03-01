import { useCallback, useEffect, useRef, useState } from 'react';
import type { Stroke } from '../types';
import { clearCanvas, drawImage, drawStroke, loadImage } from '../utils/rendering';

interface UseCanvasRendererProps {
    width: number;
    height: number;
    baseImage?: string;
    strokes: Stroke[];
}

export const useCanvasRenderer = ({ width, height, baseImage, strokes }: UseCanvasRendererProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundImageRef = useRef<HTMLImageElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Render canvas whenever strokes or base image changes
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        clearCanvas(ctx, width, height);

        if (backgroundImageRef.current) {
            drawImage(ctx, backgroundImageRef.current, width, height);
        }

        strokes.forEach((stroke) => {
            drawStroke(ctx, stroke);
        });
    }, [width, height, strokes]);

    // Load base image if in overlay mode.
    // Must come after `render` is defined so the .then() can call it directly —
    // the render effect only fires when `render` changes (i.e. when strokes/size
    // change), so we need to trigger a redraw manually after the async load.
    useEffect(() => {
        if (!baseImage) {
            backgroundImageRef.current = null;
            return;
        }

        setIsLoading(true);
        setError(null);

        loadImage(baseImage)
            .then((img) => {
                backgroundImageRef.current = img;
                setIsLoading(false);
                render();
            })
            .catch((err) => {
                console.error('Failed to load base image:', err);
                setError('Failed to load image');
                setIsLoading(false);
            });
    }, [baseImage, render]);

    // Render on stroke/size changes
    useEffect(() => {
        render();
    }, [render]);

    // Draw a temporary stroke (for live drawing feedback)
    const drawTemporaryStroke = useCallback(
        (stroke: Stroke) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            drawStroke(ctx, stroke);
        },
        []
    );

    return {
        canvasRef,
        backgroundImage: backgroundImageRef.current,
        isLoading,
        error,
        render,
        drawTemporaryStroke,
    };
};
