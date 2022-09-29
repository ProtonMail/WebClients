// Will include more rules in the future
import { hasPDFSupport } from './browser';
import { isAudio, isPDF, isSupportedImage, isSupportedText, isSupportedVideo } from './mimetype';

export const isPreviewAvailable = (mimeType: string, fileSize?: number) =>
    isSupportedImage(mimeType) ||
    isSupportedVideo(mimeType, fileSize) ||
    isAudio(mimeType) ||
    isSupportedText(mimeType) ||
    (hasPDFSupport() && isPDF(mimeType));
