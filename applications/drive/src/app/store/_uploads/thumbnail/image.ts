import { canvasToThumbnail } from './canvasUtil';
import { ThumbnailData } from './interface';
import { calculateThumbnailSize } from './util';

export const imageCannotBeLoadedError = new Error('Image cannot be loaded');

export function scaleImageFile(file: Blob): Promise<ThumbnailData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => {
            scaleImage(img).then(resolve).catch(reject);
        });
        // If image fails to be loaded, it doesn't provide any error.
        // We need to provide custom to state clearly what is happening.
        img.addEventListener('error', () => {
            reject(imageCannotBeLoadedError);
        });
        img.src = URL.createObjectURL(file);
    });
}

async function scaleImage(img: HTMLImageElement): Promise<ThumbnailData> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Null is returned only when using wrong context type.
    if (ctx === null) {
        throw new Error('Context is not available');
    }

    const [width, height] = calculateThumbnailSize(img);
    canvas.width = width;
    canvas.height = height;

    // Make white background default for transparent images.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return {
        originalWidth: img.width,
        originalHeight: img.height,
        thumbnailData: new Uint8Array(await canvasToThumbnail(canvas)),
    };
}
