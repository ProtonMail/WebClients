import { CorruptedImageError, FileLoadError } from '../../thumbnailError';

export async function getImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.addEventListener('load', async () => {
            try {
                resolve(img);
            } catch (error) {
                URL.revokeObjectURL(img.src);
                reject(error);
            }
        });

        img.addEventListener('error', (event) => {
            URL.revokeObjectURL(img.src);
            reject(
                new CorruptedImageError({
                    context: {
                        errorEvent: event.type,
                    },
                })
            );
        });

        try {
            img.src = URL.createObjectURL(file);
        } catch (error) {
            reject(
                new FileLoadError('Failed to create object URL', {
                    context: {
                        error: error instanceof Error ? error.message : String(error),
                    },
                    cause: error instanceof Error ? error : undefined,
                })
            );
        }
    });
}
