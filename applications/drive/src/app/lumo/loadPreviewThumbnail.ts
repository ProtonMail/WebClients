import type { ProtonDriveClient } from '@proton/drive';
import { getThumbnailBytes } from '@proton/drive/modules/thumbnails';

/**
 * The thumbnail bytes of the file in preview, for `OpenFile.loadViewableImage`.
 *
 * A thumbnail beats the full file: always in a format the model decodes (even for HEIC or RAW), and much
 * smaller to send. Tries HD first, then the SD one the preview placeholder already put in the store.
 * Resolves to undefined when neither is available, and the caller falls back to the file's own bytes.
 */
export const loadPreviewThumbnail = async (
    drive: Pick<ProtonDriveClient, 'iterateThumbnails'>,
    nodeUid: string,
    revisionUid?: string
) => {
    if (!revisionUid) {
        return undefined;
    }
    const bytes = await getThumbnailBytes(drive, { nodeUid, revisionUid, thumbnailTypes: ['hd', 'sd'] });
    return bytes ? [bytes] : undefined;
};
