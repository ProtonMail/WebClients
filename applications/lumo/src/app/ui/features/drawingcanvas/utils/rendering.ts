import type { Point, Stroke } from '../types';

/**
 * Draw a smooth line through points using quadratic curves
 */
export const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke): void => {
    if (stroke.points.length === 0) return;

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    if (stroke.points.length === 1) {
        // Single point - draw a dot
        const point = stroke.points[0];
        ctx.arc(point.x, point.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        return;
    }

    // Start at first point
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    // Draw smooth curves through points
    for (let i = 1; i < stroke.points.length - 1; i++) {
        const currentPoint = stroke.points[i];
        const nextPoint = stroke.points[i + 1];
        const midPoint = {
            x: (currentPoint.x + nextPoint.x) / 2,
            y: (currentPoint.y + nextPoint.y) / 2,
        };
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midPoint.x, midPoint.y);
    }

    // Draw final segment
    const lastPoint = stroke.points[stroke.points.length - 1];
    const secondLastPoint = stroke.points[stroke.points.length - 2];
    ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);

    ctx.stroke();
};

/**
 * Clear the entire canvas
 */
export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
    ctx.clearRect(0, 0, width, height);
};

/**
 * Load and draw an image onto the canvas
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Draw an image onto the canvas, scaled to fit
 */
export const drawImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
): void => {
    // Calculate scaling to fit canvas while maintaining aspect ratio
    const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center the image
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
};

/**
 * Get canvas coordinates from mouse/touch event
 */
export const getCanvasCoordinates = (
    event: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement
): Point => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
};
