import { isCompatibleCBZ, isHEIC, isSVG, isSupportedImage, isVideo } from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { heicToBlob } from './heic';
import { imageCannotBeLoadedError, scaleImageFile } from './image';
import type { Media, ThumbnailInfo } from './interface';
import { scaleSvgFile } from './svg';
import { getVideoInfo } from './video';

interface ThumbnailGenerator {
    (file: File): Promise<(Media & { thumbnails?: ThumbnailInfo[] }) | undefined>;
}

interface CheckerThumbnailCreatorPair {
    checker: (mimeType: string, name?: string) => boolean;
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
        creator: async (file: File) =>
            scaleImageFile({ file }, 'image/webp').catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            }),
    },
    {
        checker: isHEIC,
        creator: async (file: File) => {
            // is HEIC is not supported by browser we need to generate the thumbnails by decoding the file ourselves
            const blob = await heicToBlob(file);
            return scaleImageFile({ file: blob }, 'image/webp').catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            });
        },
    },
    {
        checker: (mimeType: string, name?: string) => isCompatibleCBZ(mimeType, name || ''),
        creator: async (cbz: Blob) => {
            const { getCBZCover } = await import('@proton/components/containers/filePreview/ComicBookPreview');
            const { cover, file } = await getCBZCover(cbz);

            if (cover && file) {
                return scaleImageFile(
                    {
                        file,
                    },
                    'image/webp'
                ).catch((err) => {
                    // Corrupted images cannot be loaded which we don't care about.
                    if (err === imageCannotBeLoadedError) {
                        return undefined;
                    }
                    throw err;
                });
            }

            return Promise.resolve(undefined);
        },
    },
] as const;

export const getMediaInfo = (mimeTypePromise: Promise<string>, file: File) =>
    mimeTypePromise.then(async (mimeType) => {
        const mediaInfo = CHECKER_CREATOR_LIST.find(({ checker }) => checker(mimeType, file.name))
            ?.creator(file)
            .catch((err) => {
                sendErrorReport(err);
                return undefined;
            });
        return mediaInfo;
    });
