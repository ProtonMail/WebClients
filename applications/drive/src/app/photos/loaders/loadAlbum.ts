import { MemberRole, getDriveForPhotos } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';

export const refreshAlbumMetadata = async (albumNodeUid: string) => {
    const drive = getDriveForPhotos();
    const albumsStore = useAlbumsStore.getState();

    const maybeAlbumNode = await drive.getNode(albumNodeUid);
    const { node, albumAttributes } = getNodeEntity(maybeAlbumNode);
    if (!albumAttributes) {
        return;
    }

    const isAdmin = node.directRole === MemberRole.Admin;
    let members = undefined;
    if (node.isShared && isAdmin) {
        try {
            members = await drive
                .getSharingInfo(albumNodeUid)
                .then((info) =>
                    info ? [...info.members, ...info.protonInvitations, ...info.nonProtonInvitations] : undefined
                );
        } catch (e) {
            handleSdkError(e);
        }
    }

    // The shareId is on the top root node; we need to climb from the current node to get it.
    const ancestry = await getNodeAncestry(node.uid, getDriveForPhotos());
    if (!ancestry.ok || !ancestry.value[0]?.ok) {
        sendErrorReport(new Error('[loadAlbum] Failed to resolve node ancestry'));
        return;
    }

    const rootNodeSharedId = ancestry.value[0].value.deprecatedShareId;
    const album = {
        nodeUid: node.uid,
        coverNodeUid: albumAttributes.coverPhotoNodeUid,
        photoCount: albumAttributes.photoCount,
        lastActivityTime: albumAttributes.lastActivityTime,
        name: node.name,
        createTime: node.creationTime,
        directRole: node.directRole,
        isShared: node.isShared,
        isOwner: !Boolean(node.membership),
        hasSignatureIssues: !getSignatureIssues(maybeAlbumNode).ok,
        ownedBy: node.ownedBy.email,
        members,
        deprecatedShareId: rootNodeSharedId,
    };
    albumsStore.upsertAlbum(album);
    return album;
};

export const loadCurrentAlbum = async (albumNodeUid: string, abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    const albumsStore = useAlbumsStore.getState();
    albumsStore.setLoading(true);
    try {
        const album = await refreshAlbumMetadata(albumNodeUid);
        if (album) {
            albumsStore.setCurrentAlbum(album);
        }

        const collectedUids: string[] = [];

        const photosStore = usePhotosStore.getState();

        for await (const photoItem of drive.iterateAlbum(albumNodeUid, abortSignal)) {
            collectedUids.push(photoItem.nodeUid);
            const existing = photosStore.getPhotoItem(photoItem.nodeUid);
            photosStore.setPhotoItemWithoutTimeline({
                nodeUid: photoItem.nodeUid,
                captureTime: photoItem.captureTime,
                tags: existing?.tags ?? [],
                relatedPhotoNodeUids: existing?.relatedPhotoNodeUids ?? [],
            });
        }
        albumsStore.setPhotoNodeUids(collectedUids);
    } catch (e) {
        handleSdkError(e);
    } finally {
        albumsStore.setLoading(false);
    }
};
