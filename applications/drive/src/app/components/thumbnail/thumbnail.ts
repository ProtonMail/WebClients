import { isSupportedImage, isSVG } from '@proton/components/containers/filePreview/helpers';

import { scaleImageFile } from './image';
import { scaleSvgFile } from './svg';

export async function makeThumbnail(mimeType: string, file: Blob): Promise<Uint8Array | undefined> {
    if (isSVG(mimeType)) {
        return scaleSvgFile(file);
    }

    if (isSupportedImage(mimeType)) {
        return scaleImageFile(file);
    }
}
