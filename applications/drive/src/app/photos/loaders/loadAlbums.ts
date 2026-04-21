import { type MaybeMissingNode, getDriveForPhotos } from '@proton/drive';

import { createDebouncedBuffer } from '../../utils/createDebouncedBuffer';
import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { isMissingNode } from '../../utils/sdk/node';
import { type AlbumItem, useAlbumsStore } from '../useAlbums.store';

const BATCH_SIZE = 10;

// Batch to prevent iterateNodes one by one.
async function* batchUidsToNodes(iterator: AsyncIterable<string>, drive: ReturnType<typeof getDriveForPhotos>) {
    let batch: string[] = [];
    for await (const uid of iterator) {
        batch.push(uid);
        if (batch.length >= BATCH_SIZE) {
            yield* drive.iterateNodes(batch);
            batch = [];
        }
    }
    if (batch.length > 0) {
        yield* drive.iterateNodes(batch);
    }
}

const loadAlbumsFromIterator = async (iterator: AsyncIterable<MaybeMissingNode>) => {
    const drive = getDriveForPhotos();
    const { push, drain } = createDebouncedBuffer<AlbumItem>((albums) =>
        useAlbumsStore.getState().upsertAlbums(albums)
    );

    for await (const maybeAlbum of iterator) {
        if (isMissingNode(maybeAlbum)) {
            continue;
        }
        const { node: albumNode, albumAttributes } = getNodeEntity(maybeAlbum);
        if (!albumAttributes) {
            continue;
        }
        const ancestry = await getNodeAncestry(albumNode.uid, drive);
        if (!ancestry.ok || !ancestry.value[0]?.ok) {
            sendErrorReport(new Error('[loadAlbums] Failed to resolve node ancestry'));
            continue;
        }

        const rootNodeSharedId = ancestry.value[0].value.deprecatedShareId;
        push({
            nodeUid: albumNode.uid,
            coverNodeUid: albumAttributes.coverPhotoNodeUid,
            photoCount: albumAttributes.photoCount,
            lastActivityTime: albumAttributes.lastActivityTime,
            name: albumNode.name,
            createTime: albumNode.creationTime,
            isShared: albumNode.isShared,
            directRole: albumNode.directRole,
            hasSignatureIssues: !getSignatureIssues(maybeAlbum).ok,
            // TODO: Check if it it's bulletproof
            isOwner: !Boolean(albumNode.membership),
            ownedBy: albumNode.ownedBy.email,
            deprecatedShareId: rootNodeSharedId,
        });
    }
    drain();
};

export const loadAlbums = async (abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    useAlbumsStore.getState().setLoadingList(true);
    try {
        await loadAlbumsFromIterator(batchUidsToNodes(drive.experimental.iterateAlbumUids(abortSignal), drive));
    } catch (e) {
        handleSdkError(e);
    } finally {
        useAlbumsStore.getState().setLoadingList(false);
    }
};

export const loadSharedWithMeAlbums = async (abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    useAlbumsStore.getState().setLoadingList(true);
    try {
        await loadAlbumsFromIterator(drive.iterateSharedNodesWithMe(abortSignal));
    } catch (e) {
        handleSdkError(e);
    } finally {
        useAlbumsStore.getState().setLoadingList(false);
    }
};

export const loadAllAlbums = async (abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    try {
        useAlbumsStore.getState().setLoadingList(true);
        await Promise.all([
            loadAlbumsFromIterator(batchUidsToNodes(drive.experimental.iterateAlbumUids(abortSignal), drive)),
            loadAlbumsFromIterator(drive.iterateSharedNodesWithMe(abortSignal)),
        ]);
    } catch (e) {
        handleSdkError(e);
    } finally {
        useAlbumsStore.getState().setLoadingList(false);
    }
};
