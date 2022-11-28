import { isSVG, isSupportedImage } from '@proton/shared/lib/helpers/mimetype';

import { scaleImageFile } from './image';
import { ThumbnailData } from './interface';
import { scaleSvgFile } from './svg';

export async function makeThumbnail(mimeType: string, file: Blob): Promise<ThumbnailData | undefined> {
    if (isSVG(mimeType)) {
        return scaleSvgFile(file);
    }

    if (isSupportedImage(mimeType)) {
        return scaleImageFile(file);
    }
}
