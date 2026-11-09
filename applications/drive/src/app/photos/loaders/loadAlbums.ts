import { handleSdkError, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getNodeAncestry, iterateNodesFromUidsGenerator } from '@proton/drive/modules/nodes';
import { type PhotoNode, getDriveForPhotos } from '@proton/drive/sdk';

import { createDebouncedBuffer } from '../../utils/createDebouncedBuffer';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { type AlbumItem, useAlbumsStore } from '../useAlbums.store';

const loadAlbumsFromIterator = async (iterator: AsyncIterable<PhotoNode>): Promise<Set<string>> => {
    const drive = getDriveForPhotos();
    const fetchedUids = new Set<string>();
    const { push, drain } = createDebouncedBuffer<AlbumItem>((albums) =>
        useAlbumsStore.getState().upsertAlbums(albums)
    );

    for await (const maybeAlbum of iterator) {
        const { node: albumNode, albumAttributes } = getNodeEntity(maybeAlbum);
        if (!albumAttributes) {
            continue;
        }
        const ancestry = await getNodeAncestry(albumNode.uid, drive);
        if (!ancestry.ok || !ancestry.value[0]) {
            sendErrorReport(new Error('[loadAlbums] Failed to resolve node ancestry'));
            continue;
        }

        const rootNodeSharedId = ancestry.value[0].deprecatedShareId;
        fetchedUids.add(albumNode.uid);
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
            parentNodeUid: albumNode.parentUid,
            treeEventScopeId: albumNode.treeEventScopeId,
            deprecatedShareId: rootNodeSharedId,
        });
    }
    drain();
    return fetchedUids;
};

export const loadSharedWithMeAlbums = async (abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    useAlbumsStore.getState().setLoadingList(true);
    try {
        const fetchedUids = await loadAlbumsFromIterator(
            iterateNodesFromUidsGenerator(drive.iterateSharedWithMeNodeUids(abortSignal), drive, {
                signal: abortSignal,
            })
        );
        useAlbumsStore.getState().cleanupStaleAlbums(fetchedUids, false);
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
        const [ownedSeenUids, sharedSeenUids] = await Promise.all([
            loadAlbumsFromIterator(
                iterateNodesFromUidsGenerator(drive.experimental.iterateAlbumUids(abortSignal), drive, {
                    signal: abortSignal,
                })
            ),
            loadAlbumsFromIterator(
                iterateNodesFromUidsGenerator(drive.iterateSharedWithMeNodeUids(abortSignal), drive, {
                    signal: abortSignal,
                })
            ),
        ]);
        const fetchedUids = new Set([...ownedSeenUids, ...sharedSeenUids]);
        useAlbumsStore.getState().cleanupStaleAlbums(fetchedUids);
    } catch (e) {
        handleSdkError(e);
    } finally {
        useAlbumsStore.getState().setLoadingList(false);
    }
};
