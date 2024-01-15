import { isSVG, isSupportedImage, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { imageCannotBeLoadedError, scaleImageFile } from './image';
import { Media, ThumbnailInfo, ThumbnailType } from './interface';
import { scaleSvgFile } from './svg';
import { getVideoInfo } from './video';

export interface ThumbnailGenerator {
    (
        file: Blob,
        thumbnailTypes: ThumbnailType[] | never,
        mimeType: string | never
    ): Promise<(Media & { thumbnails?: ThumbnailInfo[] }) | undefined>;
}

interface CheckerThumbnailCreatorPair {
    checker: (mimeType: string) => boolean;
    creator: ThumbnailGenerator;
}

// This is a standardised (using interface) list of function pairs - for checking mimeType and creating a thumbnail.
// This way we don't have to write separate 'if' statements for every type we handle.
// Instead, we look for the first pair where the checker returns true, and then we use the creator to generate the thumbnail.
const CHECKER_CREATOR_LIST: readonly CheckerThumbnailCreatorPair[] = [
    { checker: isVideo, creator: getVideoInfo },
    { checker: isSVG, creator: scaleSvgFile },
    {
        checker: isSupportedImage,
        creator: async (file: Blob, thumbnailTypes: ThumbnailType[], mimeType) =>
            scaleImageFile({ file, thumbnailTypes, mimeType }).catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            }),
    },
] as const;

export const getMediaInfo = (mimeTypePromise: Promise<string>, file: Blob, isForPhotos: boolean) =>
    mimeTypePromise.then(async (mimeType) => {
        const mediaInfo = CHECKER_CREATOR_LIST.find(({ checker }) => checker(mimeType))
            ?.creator(
                file,
                isForPhotos ? [ThumbnailType.PREVIEW, ThumbnailType.HD_PREVIEW] : [ThumbnailType.PREVIEW],
                mimeType
            )
            .catch((err) => {
                traceError(err);
                return undefined;
            });
        return mediaInfo;
    });
