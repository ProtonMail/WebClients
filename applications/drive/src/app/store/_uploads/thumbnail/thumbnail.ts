import { isSVG, isSupportedImage } from '@proton/shared/lib/helpers/mimetype';

import { imageCannotBeLoadedError, scaleImageFile } from './image';
import { ThumbnailData } from './interface';
import { scaleSvgFile } from './svg';

export async function makeThumbnail(mimeType: string, file: Blob): Promise<ThumbnailData | undefined> {
    if (isSVG(mimeType)) {
        return scaleSvgFile(file);
    }

    if (isSupportedImage(mimeType)) {
        return scaleImageFile(file).catch((err) => {
            // Corrupted images cannot be loaded which we don't care about.
            if (err === imageCannotBeLoadedError) {
                return undefined;
            }
            throw err;
        });
    }
}
