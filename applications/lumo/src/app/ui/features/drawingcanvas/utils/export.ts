import type { ExportOptions } from '../types';

/**
 * Export canvas as base64 data URL
 */
export const exportCanvasAsDataURL = (
    canvas: HTMLCanvasElement,
    options: ExportOptions = { format: 'png' }
): string => {
    const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = options.quality ?? 0.92;

    return canvas.toDataURL(mimeType, quality);
};

/**
 * Export canvas as Blob
 */
export const exportCanvasAsBlob = (
    canvas: HTMLCanvasElement,
    options: ExportOptions = { format: 'png' }
): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = options.quality ?? 0.92;

        canvas.toBlob(
            (blob) => {
                resolve(blob);
            },
            mimeType,
            quality
        );
    });
};

/**
 * Download canvas as image file
 */
export const downloadCanvas = async (
    canvas: HTMLCanvasElement,
    filename: string,
    options: ExportOptions = { format: 'png' }
): Promise<void> => {
    const dataURL = exportCanvasAsDataURL(canvas, options);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
};

/**
 * Create a composite image with background and drawing overlay
 */
export const createCompositeImage = async (
    backgroundImage: HTMLImageElement | null,
    drawingCanvas: HTMLCanvasElement,
    width: number,
    height: number
): Promise<string> => {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = width;
    compositeCanvas.height = height;

    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Draw background if exists
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, width, height);
    }

    // Draw the drawing layer on top
    ctx.drawImage(drawingCanvas, 0, 0);

    return exportCanvasAsDataURL(compositeCanvas);
};
