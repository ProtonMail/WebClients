import { CanvasError, CorruptedImageError } from '../../thumbnailError';

export const getImageFromCanvas = async (canvas: HTMLCanvasElement): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(
                        new CanvasError('Failed to create blob from canvas', {
                            context: {
                                canvasWidth: canvas.width,
                                canvasHeight: canvas.height,
                                hasContext: !!canvas.getContext('2d'),
                            },
                        })
                    );
                    return;
                }

                const img = new Image();
                img.addEventListener('load', () => {
                    resolve(img);
                });

                img.addEventListener('error', () => {
                    URL.revokeObjectURL(img.src);
                    reject(
                        new CorruptedImageError({
                            context: {
                                stage: 'canvas to image conversion',
                                canvasWidth: canvas.width,
                                canvasHeight: canvas.height,
                            },
                        })
                    );
                });

                img.src = URL.createObjectURL(blob);
            },
            'image/jpeg',
            0.9
        );
    });
};
