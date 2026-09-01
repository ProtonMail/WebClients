import { NodeType, NodeWithSameNameExistsValidationError, ThumbnailType, getDrive } from '@proton/drive';

import type { PreparedBackground } from '../backgroundPreview';
import { isAllowedBackgroundMediaType } from '../constants';

/** A background as Drive reports it, carrying the revision the cache reconciles on. */
export interface DriveBackground {
    nodeUid: string;
    revisionUid?: string;
    name: string;
    mediaType: string;
    createdAt: number;
}

/**
 * Two steps because `iterateFolderChildrenNodeUids` yields bare UIDs, not the fields we reconcile on.
 * Anything can be dropped into the folder by hand and the API only filters folders, so files outside
 * the allowlist are skipped here.
 */
export const listDriveBackgrounds = async ({
    folderUid,
    signal,
}: {
    folderUid: string;
    signal?: AbortSignal;
}): Promise<DriveBackground[]> => {
    const drive = getDrive();
    const childUids: string[] = [];

    for await (const uid of drive.iterateFolderChildrenNodeUids(folderUid, undefined, signal)) {
        childUids.push(uid);
    }

    if (!childUids.length) {
        return [];
    }

    const backgrounds: DriveBackground[] = [];

    for await (const node of drive.iterateNodes(childUids, signal)) {
        if (
            'missingUid' in node ||
            node.type !== NodeType.File ||
            node.trashTime ||
            !isAllowedBackgroundMediaType(node.mediaType) ||
            !node.name.ok
        ) {
            continue;
        }

        backgrounds.push({
            nodeUid: node.uid,
            revisionUid: node.activeRevision?.uid,
            name: node.name.value,
            mediaType: node.mediaType,
            createdAt: node.creationTime.getTime(),
        });
    }

    return backgrounds;
};

export const fetchDriveBackgroundPreviews = async ({
    nodeUids,
    signal,
}: {
    nodeUids: string[];
    signal?: AbortSignal;
}): Promise<Map<string, Uint8Array<ArrayBuffer>>> => {
    const previews = new Map<string, Uint8Array<ArrayBuffer>>();

    if (!nodeUids.length) {
        return previews;
    }

    for await (const result of getDrive().iterateThumbnails(nodeUids, ThumbnailType.Type1, signal)) {
        if (result.ok) {
            previews.set(result.nodeUid, result.thumbnail);
        }
    }

    return previews;
};

export const downloadDriveBackground = async ({
    nodeUid,
    signal,
}: {
    nodeUid: string;
    signal?: AbortSignal;
}): Promise<Uint8Array<ArrayBuffer>> => {
    const downloader = await getDrive().getFileDownloader(nodeUid, signal);
    const chunks: Uint8Array<ArrayBuffer>[] = [];

    const controller = downloader.downloadToStream(
        new WritableStream<Uint8Array<ArrayBuffer>>({
            write(chunk) {
                chunks.push(chunk);
            },
        })
    );

    await controller.completion();

    const image = new Uint8Array(new ArrayBuffer(chunks.reduce((size, chunk) => size + chunk.byteLength, 0)));
    let offset = 0;

    for (const chunk of chunks) {
        image.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return image;
};

export interface UploadedDriveBackground {
    nodeUid: string;
    revisionUid: string;
    name: string;
}

export const uploadDriveBackground = async ({
    folderUid,
    file,
    name: requestedName,
    mediaType,
    prepared,
    signal,
}: {
    folderUid: string;
    file: File;
    name: string;
    mediaType: string;
    prepared: PreparedBackground;
    signal?: AbortSignal;
}): Promise<UploadedDriveBackground> => {
    const drive = getDrive();

    const upload = async (name: string) => {
        const uploader = await drive.getFileUploader(folderUid, name, { mediaType, expectedSize: file.size }, signal);
        const controller = await uploader.uploadFromStream(file.stream(), prepared.thumbnails);
        const { nodeUid, nodeRevisionUid } = await controller.completion();

        return { nodeUid, revisionUid: nodeRevisionUid, name };
    };

    try {
        return await upload(requestedName);
    } catch (error) {
        // The name is almost always free, so paying for getAvailableName upfront on every upload
        // is not worth it; resolve a free one only once the server tells us it is taken.
        if (!(error instanceof NodeWithSameNameExistsValidationError)) {
            throw error;
        }

        return upload(await drive.getAvailableName(folderUid, requestedName));
    }
};

/** Trashed rather than permanently deleted, so the user can recover it. */
export const trashDriveBackground = async ({ nodeUid }: { nodeUid: string }): Promise<void> => {
    for await (const result of getDrive().trashNodes([nodeUid])) {
        if (!result.ok) {
            throw result.error;
        }
    }
};
