import { THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';

export function calculateThumbnailSize(img: { width: number; height: number }): [width: number, height: number] {
    const ratio = Math.min(1, THUMBNAIL_MAX_SIDE / Math.max(img.width, img.height));
    return [Math.ceil(ratio * img.width), Math.ceil(ratio * img.height)];
}
