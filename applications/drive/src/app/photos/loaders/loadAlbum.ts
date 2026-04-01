import { MemberRole, getDriveForPhotos } from '@proton/drive';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { useAlbumsStore } from '../useAlbums.store';
import { usePhotosStore } from '../usePhotos.store';

export const refreshAlbumMetadata = async (albumNodeUid: string) => {
    const drive = getDriveForPhotos();
    const store = useAlbumsStore.getState();

    const maybeAlbumNode = await drive.getNode(albumNodeUid);
    const { node, albumAttributes } = getNodeEntity(maybeAlbumNode);

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

    store.setCurrentAlbum({
        nodeUid: node.uid,
        name: node.name,
        coverNodeUid: albumAttributes?.coverPhotoNodeUid,
        photoCount: albumAttributes?.photoCount,
        lastActivityTime: node.modificationTime,
        members,
    });
};

export const loadAlbum = async (albumNodeUid: string, abortSignal?: AbortSignal) => {
    const drive = getDriveForPhotos();
    const store = useAlbumsStore.getState();

    await refreshAlbumMetadata(albumNodeUid);

    store.setLoading(true);

    const collectedUids: string[] = [];

    const photosStore = usePhotosStore.getState();

    try {
        for await (const albumItem of drive.iterateAlbum(albumNodeUid, abortSignal)) {
            collectedUids.push(albumItem.nodeUid);
            store.addPhotoNodeUid(albumItem.nodeUid);
            photosStore.setPhotoItemWithoutTimeline({
                nodeUid: albumItem.nodeUid,
                captureTime: albumItem.captureTime,
                tags: [],
                relatedPhotoNodeUids: [],
            });
        }
        store.setPhotoNodeUids(collectedUids);
    } finally {
        store.setLoading(false);
    }
};
