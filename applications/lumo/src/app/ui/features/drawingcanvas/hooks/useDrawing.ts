import { useCallback, useRef, useState } from 'react';
import type { Stroke } from '../types';
import { getCanvasCoordinates } from '../utils/rendering';

interface UseDrawingProps {
    color: string;
    strokeWidth: number;
    onStrokeComplete: (stroke: Stroke) => void;
}

export const useDrawing = ({ color, strokeWidth, onStrokeComplete }: UseDrawingProps) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const currentStrokeRef = useRef<Stroke | null>(null);

    const startDrawing = useCallback(
        (event: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
            event.preventDefault();

            const point = getCanvasCoordinates(event, canvas);

            currentStrokeRef.current = {
                points: [point],
                color,
                width: strokeWidth,
            };

            setIsDrawing(true);
        },
        [color, strokeWidth]
    );

    const continueDrawing = useCallback(
        (event: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
            if (!isDrawing || !currentStrokeRef.current) return;

            event.preventDefault();

            const point = getCanvasCoordinates(event, canvas);
            currentStrokeRef.current.points.push(point);

            return currentStrokeRef.current;
        },
        [isDrawing]
    );

    const stopDrawing = useCallback(() => {
        if (!isDrawing || !currentStrokeRef.current) return;

        onStrokeComplete(currentStrokeRef.current);
        currentStrokeRef.current = null;
        setIsDrawing(false);
    }, [isDrawing, onStrokeComplete]);

    const cancelDrawing = useCallback(() => {
        currentStrokeRef.current = null;
        setIsDrawing(false);
    }, []);

    return {
        isDrawing,
        startDrawing,
        continueDrawing,
        stopDrawing,
        cancelDrawing,
    };
};
