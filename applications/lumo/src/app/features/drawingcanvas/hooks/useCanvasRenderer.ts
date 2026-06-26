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
    const strokesRef = useRef(strokes);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    strokesRef.current = strokes;

    // Stable render — reads latest strokes from ref so we don't retrigger image loading.
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        clearCanvas(ctx, width, height);

        if (backgroundImageRef.current) {
            drawImage(ctx, backgroundImageRef.current, width, height);
        }

        strokesRef.current.forEach((stroke) => {
            drawStroke(ctx, stroke);
        });
    }, [width, height]);

    // Load base image only when the source changes — not when strokes update.
    useEffect(() => {
        if (!baseImage) {
            backgroundImageRef.current = null;
            render();
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        loadImage(baseImage)
            .then((img) => {
                if (cancelled) return;
                backgroundImageRef.current = img;
                setIsLoading(false);
                render();
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to load base image:', err);
                setError('Failed to load image');
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [baseImage, render]);

    // Redraw committed strokes when they change or canvas size changes.
    useEffect(() => {
        render();
    }, [strokes, render]);

    // Live preview: full redraw of committed strokes, then draw the in-progress stroke.
    const drawTemporaryStroke = useCallback(
        (stroke: Stroke) => {
            render();

            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            drawStroke(ctx, stroke);
        },
        [render]
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
