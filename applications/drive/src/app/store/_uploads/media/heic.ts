type Callback = (buf: ArrayBufferLike) => void;
interface HeifImage {
    get_width: () => number;
    get_height: () => number;
    display: (image: ImageData, callback: Callback) => void;
}

interface HeifDecoder {
    decode(data: Uint8Array): HeifImage[];
}

interface LibheifModule {
    HeifDecoder: new () => HeifDecoder;
}

interface HeicToBlobOptions {
    format?: 'image/jpeg' | 'image/webp';
}

/**
 * Converts a HEIC file to an image Blob
 * @param heicFile - The HEIC File
 * @param options - Optional parameters
 * @returns Promise resolving to an image blob in the requested format
 */
export async function heicToBlob(heicFile: File | Blob, options: HeicToBlobOptions = {}): Promise<Blob> {
    const format = options.format || 'image/webp';

    let libheif: LibheifModule;
    try {
        libheif = await import(
            /* webpackMode: "lazy" */
            /* webpackChunkName: "heic-libheif-js" */
            'libheif-js/wasm-bundle'
        );
    } catch (error) {
        throw new Error(`Failed to import libheif-js: ${(error as Error).message}`);
    }

    try {
        const decoder = new libheif.HeifDecoder();
        const heicBuffer = await heicFile.arrayBuffer();
        const heicData = new Uint8Array(heicBuffer);
        const data = decoder.decode(heicData);

        if (!data || data.length === 0) {
            throw new Error('Failed to decode HEIC image');
        }

        const image = data[0];
        const width = image.get_width();
        const height = image.get_height();

        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get canvas context');
        }
        const imageData = context.createImageData(width, height);

        await new Promise<void>((resolve, reject) => {
            image.display(imageData, (displayData) => {
                if (!displayData) {
                    return reject(new Error('HEIF processing error'));
                }

                resolve();
            });
        });

        context.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>(async (resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                format,
                1
            );
        });
        return blob;
    } catch (error) {
        throw new Error(`HEIC to Blob conversion failed: ${(error as Error).message}`);
    }
}
