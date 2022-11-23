import { THUMBNAIL_MAX_SIDE, THUMBNAIL_MAX_SIZE, THUMBNAIL_QUALITIES } from '@proton/shared/lib/drive/constants';

import { ThumbnailData } from './interface';

export function scaleImageFile(file: Blob): Promise<ThumbnailData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => {
            scaleImage(img).then(resolve).catch(reject);
        });
        img.addEventListener('error', reject);
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

export function calculateThumbnailSize(img: { width: number; height: number }): [width: number, height: number] {
    const imgWidth = img.width || THUMBNAIL_MAX_SIDE;
    const imgHeight = img.height || THUMBNAIL_MAX_SIDE;
    // // Keep image smaller than our thumbnail as is.
    if (!(imgWidth > THUMBNAIL_MAX_SIDE || imgHeight > THUMBNAIL_MAX_SIDE)) {
        return [imgWidth, imgHeight];
    }

    // getSize returns the other side, always as non-zero integer.
    const getSize = (ratio: number): number => {
        const result = Math.round(ratio * THUMBNAIL_MAX_SIDE);
        return result === 0 ? 1 : result;
    };

    // Otherwise scale down based on the bigger side.
    if (imgWidth > imgHeight) {
        return [THUMBNAIL_MAX_SIDE, getSize(imgHeight / imgWidth)];
    }
    return [getSize(imgWidth / imgHeight), THUMBNAIL_MAX_SIDE];
}

async function canvasToThumbnail(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
    // We check clear text thumbnail size but the limit on API is for encrypted
    // text. To do the check on proper place would be too dificult for little
    // gain. The increase in size is under 10 percent, so limit it to 90% of
    // real limit is reasonable.
    const maxSize = THUMBNAIL_MAX_SIZE * 0.9;

    for (const quality of THUMBNAIL_QUALITIES) {
        const data = await canvasToArrayBuffer(canvas, 'image/jpeg', quality);
        if (data.byteLength < maxSize) {
            return data;
        }
    }
    throw new Error('Cannot create small enough thumbnail');
}

function canvasToArrayBuffer(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (d) => {
                if (!d) {
                    reject(new Error('Blob not available'));
                    return;
                }

                const r = new FileReader();
                r.addEventListener('load', () => {
                    resolve(r.result as ArrayBuffer);
                });
                r.addEventListener('error', reject);
                r.readAsArrayBuffer(d);
            },
            mime,
            quality
        )
    );
}
