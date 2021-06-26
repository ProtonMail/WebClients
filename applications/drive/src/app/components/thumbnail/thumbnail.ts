import { isSupportedImage } from '@proton/components/containers/filePreview/helpers';

import { scaleImageFile } from './image';

export function makeThumbnail(mimeType: string, file: Blob): Promise<Uint8Array | undefined> {
    if (isSupportedImage(mimeType)) {
        return scaleImageFile(file);
    }
    return Promise.resolve(undefined);
}
