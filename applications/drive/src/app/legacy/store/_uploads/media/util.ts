import { HD_THUMBNAIL_MAX_SIDE, THUMBNAIL_MAX_SIDE } from '@proton/shared/lib/drive/constants';

import { ThumbnailType } from './interface';

export function calculateThumbnailSize(
    img: { width: number; height: number },
    thumbnailType: ThumbnailType = ThumbnailType.PREVIEW
): [width: number, height: number] {
    const ratio = Math.min(
        1,
        thumbnailType === ThumbnailType.HD_PREVIEW
            ? HD_THUMBNAIL_MAX_SIDE
            : THUMBNAIL_MAX_SIDE / Math.max(img.width, img.height)
    );
    return [Math.ceil(ratio * img.width), Math.ceil(ratio * img.height)];
}
