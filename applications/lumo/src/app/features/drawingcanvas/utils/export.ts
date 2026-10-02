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
