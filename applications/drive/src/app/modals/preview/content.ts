import type { MaybeNode } from '@proton/drive';
import { isIWAD, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable, isPreviewTooLarge } from '@proton/shared/lib/helpers/preview';

import { getNodeDisplaySize } from '../../utils/sdk/getNodeDisplaySize';
import { streamToBuffer } from '../../utils/stream';
import { loadCreateReadableStreamWrapper } from '../../utils/webStreamsPolyfill';
import { getNodeMimeType, getNodeStorageSize } from './nodeUtils';

export enum ContentPreviewMethod {
    Buffer = 'buffer',
    Streaming = 'streaming',
    Thumbnail = 'thumbnail',
}

interface GetFileDownloader {
    getFileDownloader: (nodeUid: string, abortSignal: AbortSignal) => Promise<FileDownloader>;
}

interface FileDownloader {
    downloadToStream: (
        writable: WritableStream<Uint8Array<ArrayBuffer>>,
        onProgress: (downloadedBytes: number) => void
    ) => DownloadController;
}

interface DownloadController {
    pause: () => void;
    resume: () => void;
    completion: () => Promise<void>;
    isDownloadCompleteWithSignatureIssues: () => boolean;
}

export function getContentPreviewMethod(node: MaybeNode): ContentPreviewMethod {
    const mimeType = getNodeMimeType(node);

    if (!mimeType) {
        return ContentPreviewMethod.Thumbnail;
    }

    // TOOD: Streaming has many edge cases and doesn't work well for all videos
    // or all brossers. Due to the nature that indicies for the video files
    // might be missing or wrong, service worker not working or available,
    // loading taking a lot of time that playback cannot recover from (yet),
    // etc. we prefer using buffer solution for video files of reasonable size.
    // In the future, it might still be wise to use buffered solution for small
    // videos, but we want to use streaming for majority of video or even audio
    // files.
    if (isVideo(mimeType) && isPreviewTooLarge(mimeType, getNodeStorageSize(node))) {
        return ContentPreviewMethod.Streaming;
    }

    if (isPreviewAvailable(mimeType, getNodeDisplaySize(node)) || isIWAD(mimeType)) {
        return ContentPreviewMethod.Buffer;
    }

    return ContentPreviewMethod.Thumbnail;
}

export async function downloadContent(drive: GetFileDownloader, nodeUid: string, abortSignal: AbortSignal) {
    const transformStream = new TransformStream<Uint8Array<ArrayBuffer>>();
    const stream = await loadCreateReadableStreamWrapper(transformStream.readable);
    const writer = transformStream.writable.getWriter();

    const wrappedWritable = new WritableStream<Uint8Array<ArrayBuffer>>({
        write: (chunk) => writer.write(chunk),
        close: () => writer.close(),
        abort: (reason) => writer.abort(reason),
    });

    const downloader = await drive.getFileDownloader(nodeUid, abortSignal);
    const controller = downloader.downloadToStream(wrappedWritable, () => {});

    const bufferPromise = streamToBuffer(stream);

    try {
        await controller.completion();
        await writer.close();
    } catch (error) {
        if (controller.isDownloadCompleteWithSignatureIssues()) {
            await writer.close();
            return { contents: await bufferPromise, hasSignatureIssues: true };
        }

        await writer.abort(error).catch(() => {});
        throw error;
    } finally {
        try {
            writer.releaseLock();
        } catch {
            // Some browser handle releaseLock in a way where it can throw TypeError.
            // This is fine but as it can cause crash in the logic we hanld it here
        }
    }

    return { contents: await bufferPromise, hasSignatureIssues: false };
}
