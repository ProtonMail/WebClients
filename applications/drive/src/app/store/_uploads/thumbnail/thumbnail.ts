import { HD_THUMBNAIL_MAX_SIDE, SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isSVG, isSupportedImage } from '@proton/shared/lib/helpers/mimetype';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { imageCannotBeLoadedError, scaleImageFile } from './image';
import { ThumbnailData, ThumbnailGenerator, ThumbnailType } from './interface';
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
        creator: async (file: Blob, thumbnailType: ThumbnailType) =>
            scaleImageFile(file, thumbnailType).catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            }),
    },
    { checker: isVideoForThumbnail, creator: createVideoThumbnail },
] as const;

export const makeThumbnail = async (
    mimeType: string,
    file: Blob,
    thumbnailType: ThumbnailType = ThumbnailType.PREVIEW
): Promise<ThumbnailData | undefined> =>
    CHECKER_CREATOR_LIST.find(({ checker }) => checker(mimeType))
        ?.creator(file, thumbnailType)
        .then(
            (thumbnailData) =>
                thumbnailData && {
                    ...thumbnailData,
                    thumbnailType,
                }
        );

export const getThumbnailsData = (mimeTypePromise: Promise<string>, file: File, isForPhotos: boolean) =>
    mimeTypePromise.then(async (mimeType) => {
        const previewThumbnail = await makeThumbnail(mimeType, file).catch((err) => {
            traceError(err);
            return undefined;
        });
        if (!previewThumbnail) {
            return undefined;
        }
        if (
            !isForPhotos ||
            (mimeType == SupportedMimeTypes.jpg &&
                previewThumbnail?.originalWidth &&
                previewThumbnail?.originalWidth <= HD_THUMBNAIL_MAX_SIDE)
        ) {
            return [previewThumbnail];
        }
        const photoThumbnail = await makeThumbnail(mimeType, file, ThumbnailType.HD_PREVIEW).catch((err) => {
            traceError(err);
            return undefined;
        });
        if (photoThumbnail) {
            return [previewThumbnail, photoThumbnail];
        }
        return undefined;
    });
