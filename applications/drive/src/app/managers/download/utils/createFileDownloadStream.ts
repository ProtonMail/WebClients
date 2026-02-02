import { sha1 } from '@noble/hashes/sha1';
import { bytesToHex } from '@noble/hashes/utils';

import type { DownloadController, NodeEntity } from '@proton/drive';

import { useDownloadManagerStore } from '../../../zustand/download/downloadManager.store';
import type { MalwareDetection } from '../malwareDetection/malwareDetection';
import { downloadLogDebug } from './downloadLogger';
import { getDownloadSdk } from './getDownloadSdk';

export type FileDownloadStreamResult = {
    stream: ReadableStream<Uint8Array<ArrayBuffer>>;
    controller: DownloadController;
    claimedSize?: number;
    isWriterClosed: () => boolean;
    closeWriter: () => void;
    abortWriter: (reason?: unknown) => void;
    computeDownloadedHash: () => string;
};

type CreateFileDownloadStreamParams = {
    downloadId: string;
    node: NodeEntity;
    abortSignal: AbortSignal;
    onProgress: (downloadedBytes: number) => void;
    malwareDetection: MalwareDetection;
};

/**
 * Creates a file download stream with progress tracking and malware detection.
 * Returns the readable stream, controller, and utilities for managing the stream lifecycle.
 */
export async function createFileDownloadStream({
    downloadId,
    node,
    abortSignal,
    onProgress,
    malwareDetection,
}: CreateFileDownloadStreamParams): Promise<FileDownloadStreamResult> {
    const { getQueueItem } = useDownloadManagerStore.getState();
    const queueItem = getQueueItem(downloadId);
    const revisionUid = queueItem?.revisionUid;

    const drive = getDownloadSdk(downloadId);

    // ProtonDrivePublicLinkClient does not allow revision download
    const downloader =
        revisionUid && 'getFileRevisionDownloader' in drive
            ? await drive.getFileRevisionDownloader(revisionUid, abortSignal)
            : await drive.getFileDownloader(node.uid, abortSignal);

    const claimedSize = downloader.getClaimedSizeInBytes();

    const transformStream = new TransformStream<Uint8Array<ArrayBuffer>>();
    const streamWriter = transformStream.writable.getWriter();
    let writerClosed = false;
    let computedHash: string | undefined;
    const hashInstance = sha1.create();

    // SDK expects a WritableStream, so wrap our writer while keeping control over it
    const writableForDownloader = new WritableStream<Uint8Array<ArrayBuffer>>({
        write(chunk) {
            hashInstance.update(chunk);
            return streamWriter.write(chunk);
        },
        close() {
            writerClosed = true;
            return streamWriter.close();
        },
        abort(reason) {
            writerClosed = true;
            return streamWriter.abort(reason);
        },
    });

    const controller = downloader.downloadToStream(writableForDownloader, onProgress);

    const isWriterClosed = () => writerClosed;

    const closeWriter = () => {
        if (writerClosed) {
            return;
        }
        writerClosed = true;
        streamWriter.close().catch(() => {
            downloadLogDebug('Download error on closing streamWriter', { downloadId });
        });
    };

    const abortWriter = (reason?: unknown) => {
        if (writerClosed) {
            return;
        }
        writerClosed = true;
        streamWriter.abort(reason).catch(() => {
            downloadLogDebug('Download error on aborting streamWriter', { downloadId });
        });
    };

    const computeDownloadedHash = () => {
        if (computedHash) {
            return computedHash;
        }
        const snapshot = hashInstance.clone();
        const hash = bytesToHex(snapshot.digest());
        if (writerClosed) {
            computedHash = hash;
        }
        return hash;
    };

    const wrappedStream = malwareDetection.wrapStream(downloadId, node, transformStream.readable);

    return {
        stream: wrappedStream,
        controller,
        claimedSize,
        isWriterClosed,
        closeWriter,
        abortWriter,
        computeDownloadedHash,
    };
}
