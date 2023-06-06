import { isSVG, isSupportedImage } from '@proton/shared/lib/helpers/mimetype';

import { imageCannotBeLoadedError, scaleImageFile } from './image';
import { ThumbnailData, ThumbnailGenerator } from './interface';
import { scaleSvgFile } from './svg';
import { createVideoThumbnail, isVideoForThumbnail } from './video';

interface CheckerThumbnailCreatorPair {
    checker: (mimeType: string) => boolean;
    creator: ThumbnailGenerator;
}

// This is a standardised (using interface) list of function pairs - for checking mimeType and creating a thumbnail.
// This way we don't have to write separate 'if' statements for every type we handle.
// Instead, we look for the first pair where the checker returns true, and then we use the creator to generate the thumbnail.
const CHECKER_CREATOR_LIST: readonly CheckerThumbnailCreatorPair[] = [
    { checker: isSVG, creator: scaleSvgFile },
    {
        checker: isSupportedImage,
        creator: async (file: Blob) =>
            scaleImageFile(file).catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            }),
    },
    { checker: isVideoForThumbnail, creator: createVideoThumbnail },
] as const;

export const makeThumbnail = async (mimeType: string, file: Blob): Promise<ThumbnailData | undefined> =>
    CHECKER_CREATOR_LIST.find(({ checker }) => checker(mimeType))?.creator(file);
