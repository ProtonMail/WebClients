import type { RawProcessorWorkerInterface } from '@proton/raw-images';
import { createWorker } from '@proton/raw-images';
import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import { isIos, isSafari } from '@proton/shared/lib/helpers/browser';
import {
    getFileExtension,
    isCompatibleCBZ,
    isHEIC,
    isRAWExtension,
    isRAWPhoto,
    isRAWThumbnailExtractionSupported,
    isSVG,
    isSupportedImage,
    isVideo,
} from '@proton/shared/lib/helpers/mimetype';

import { sendErrorReport } from '../../../utils/errorHandling';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { heicToBlob } from './heic';
import { imageCannotBeLoadedError, scaleImageFile } from './image';
import type { Media, ThumbnailInfo } from './interface';
import { scaleSvgFile } from './svg';
import { getVideoInfo } from './video';

interface ThumbnailGenerator {
    (file: File, name?: string): Promise<(Media & { thumbnails?: ThumbnailInfo[] }) | undefined>;
}

interface CheckerThumbnailCreatorPair {
    checker: (mimeType: string, name?: string) => boolean;
    creator: ThumbnailGenerator;
}

// On Safari, it supports WebP thumbnail but NOT WebP thumbnails + quality reduction with .toBlob()
// The size will remain the same and no error will be thrown
// Which means if the image is above a certain size it won't generate thumbnail
// For safety we fallback to JPEG for Safari
const thumbnailFormat = isSafari() || isIos() ? SupportedMimeTypes.jpg : SupportedMimeTypes.webp;
// This is a standardised (using interface) list of function pairs - for checking mimeType and creating a thumbnail.
// This way we don't have to write separate 'if' statements for every type we handle.
// Instead, we look for the first pair where the checker returns true, and then we use the creator to generate the thumbnail.
const CHECKER_CREATOR_LIST: readonly CheckerThumbnailCreatorPair[] = [
    { checker: isVideo, creator: (file: File) => getVideoInfo(file, thumbnailFormat) },
    { checker: isSVG, creator: scaleSvgFile },
    {
        checker: isSupportedImage,
        creator: async (file: File) =>
            scaleImageFile({ file }, thumbnailFormat).catch((err) => {
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
            // if HEIC is not supported by browser we need to generate the thumbnails by decoding the file ourselves
            const blob = await heicToBlob(file);
            void countActionWithTelemetry(Actions.ConvertedHEIC);
            return scaleImageFile({ file: blob }, thumbnailFormat).catch((err) => {
                // Corrupted images cannot be loaded which we don't care about.
                if (err === imageCannotBeLoadedError) {
                    return undefined;
                }
                throw err;
            });
        },
    },
    {
        checker: (mimeType: string, name?: string) => {
            const extension = getFileExtension(name);
            return (
                (isRAWPhoto(mimeType) || isRAWExtension(extension)) &&
                isRAWThumbnailExtractionSupported(mimeType, extension)
            );
        },
        creator: async (file: File, name?: string) => {
            let processor: RawProcessorWorkerInterface | undefined;
            try {
                const buffer = await file.arrayBuffer();
                const data = new Uint8Array(buffer);
                processor = await createWorker(data, name);
                await processor.initialize();
                const result = await processor.extractThumbnail(data, name);
                if (result) {
                    void countActionWithTelemetry(Actions.ExtractedFromRaw);
                    const blob = new Blob([result], { type: 'image/jpeg' });
                    const props = await scaleImageFile({ file: blob }, thumbnailFormat).catch((err) => {
                        if (err === imageCannotBeLoadedError) {
                            return undefined;
                        }
                        throw err;
                    });
                    return props;
                } else {
                    return undefined;
                }
            } catch (e) {
                sendErrorReport(e);
                return undefined;
            } finally {
                if (processor) {
                    processor.terminate();
                }
            }
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
                    thumbnailFormat
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
            ?.creator(file, file.name)
            .catch((err) => {
                sendErrorReport(err);
                return undefined;
            });
        return mediaInfo;
    });
