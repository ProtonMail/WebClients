import type { MaybeNode } from '@proton/drive';
import { isIWAD, isVideo } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable, isPreviewTooLarge } from '@proton/shared/lib/helpers/preview';

import { streamToBuffer } from '../../utils/stream';
import { loadCreateReadableStreamWrapper } from '../../utils/webStreamsPolyfill';
import { getNodeDisplaySize, getNodeMimeType, getNodeStorageSize } from './nodeUtils';

export enum ContentPreviewMethod {
    Buffer = 'buffer',
    Streaming = 'streaming',
    Thumbnail = 'thumbnail',
}

interface GetFileDownloader {
    getFileDownloader: (nodeUid: string, abortSignal: AbortSignal) => Promise<FileDownloader>;
}

interface FileDownloader {
    downloadToStream: (writable: WritableStream<Uint8Array<ArrayBuffer>>) => {
        completion: () => Promise<void>;
    };
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
    const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
    const stream = await loadCreateReadableStreamWrapper(readable);

    const downloader = await drive.getFileDownloader(nodeUid, abortSignal);
    const controller = downloader.downloadToStream(writable);
    const contents = await streamToBuffer(stream);

    await controller.completion();
    return contents;
}
