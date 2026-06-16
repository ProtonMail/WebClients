import type { NodeEntity, PhotoNode } from '@proton/drive';
import { NodeType, getDriveForPhotos } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import type { BusDriverClient } from '@proton/drive/modules/busDriver';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { Logging } from '@proton/drive/modules/logging';

import { getSignatureIssues } from '../utils/sdk/getSignatureIssues';
import { mapNodeToPhotoItem } from './PhotosWithAlbums/loaders/mapNodeToAdditionalInfo';
import { loadCurrentAlbum } from './loaders/loadAlbum';
import type { AlbumItem } from './useAlbums.store';
import { useAlbumsStore } from './useAlbums.store';
import { usePhotosStore } from './usePhotos.store';

const logging = new Logging({ sentryComponent: 'drive-web-log' });
const logger = logging.getLogger('subscribe-to-photos-events');

const isPhotoNode = (node: NodeEntity): node is PhotoNode => {
    return [NodeType.Photo, NodeType.Album].includes(node.type);
};

const nodeToAlbumItem = (nodeEntity: NodeEntity, item: { isShared?: boolean }): AlbumItem => {
    const { node, albumAttributes } = getNodeEntity(nodeEntity);
    if (!albumAttributes) {
        throw new Error('nodeToAlbumItem called on non-album node');
    }
    return {
        nodeUid: node.uid,
        parentNodeUid: node.parentUid,
        coverNodeUid: albumAttributes.coverPhotoNodeUid,
        photoCount: albumAttributes.photoCount,
        lastActivityTime: albumAttributes.lastActivityTime,
        name: node.name,
        createTime: node.creationTime,
        isShared: Boolean(item.isShared),
        directRole: node.directRole,
        isOwner: !Boolean(node.membership),
        hasSignatureIssues: !getSignatureIssues(nodeEntity).ok,
        ownedBy: node.ownedBy.email,
        treeEventScopeId: node.treeEventScopeId,
        deprecatedShareId: node.deprecatedShareId,
    };
};

const onCreatedOrRestoredNodes =
    (photosRootNodeUid: string | undefined) =>
    async (
        event: { items: { uid: string; parentUid?: string; isTrashed?: boolean; isShared?: boolean }[] },
        driveClient: BusDriverClient
    ) => {
        for (const item of event.items) {
            try {
                if (item.isTrashed) {
                    continue;
                }
                const isMyPhotos = item.parentUid === photosRootNodeUid;
                // Skip events not related to my photos or with a known non-photos parent
                if (!isMyPhotos && item.parentUid !== undefined) {
                    continue;
                }
                const node = await driveClient.getNode(item.uid);
                const { photoAttributes, albumAttributes } = getNodeEntity(node);
                if (isPhotoNode(node) && !photoAttributes && !albumAttributes) {
                    logger.warn(
                        `[subscribeToPhotosEvents] A photo/album element doesn't have photo/album attributes: ${JSON.stringify(item)}`
                    );
                    continue;
                }
                if (node.type === NodeType.Photo && photoAttributes) {
                    if (isMyPhotos) {
                        if (photoAttributes.mainPhotoNodeUid) {
                            usePhotosStore
                                .getState()
                                .addRelatedPhotoNodeUid(photoAttributes.mainPhotoNodeUid, node.uid);
                        } else {
                            usePhotosStore.getState().setPhotoItem({
                                nodeUid: node.uid,
                                captureTime: photoAttributes.captureTime,
                                tags: photoAttributes.tags,
                                relatedPhotoNodeUids: photoAttributes.relatedPhotoNodeUids,
                            });
                        }
                    }
                    // Sync album membership using node data
                    const currentAlbumUids = new Set(photoAttributes.albums.map((a) => a.nodeUid));
                    for (const [albumUid] of useAlbumsStore.getState().albums) {
                        if (currentAlbumUids.has(albumUid)) {
                            useAlbumsStore.getState().addPhotoNodeUid(albumUid, node.uid);
                        }
                    }
                } else if (node.type === NodeType.Album && albumAttributes) {
                    useAlbumsStore.getState().upsertAlbum(nodeToAlbumItem(node, item));
                }
            } catch (e) {
                handleSdkError(e);
            }
        }
    };

const onUpdatedNodes =
    (photosRootNodeUid: string | undefined) =>
    async (
        event: { items: { uid: string; parentUid?: string; isTrashed?: boolean; isShared?: boolean }[] },
        driveClient: BusDriverClient
    ) => {
        for (const item of event.items) {
            const isMyPhotos = item.parentUid === photosRootNodeUid;
            const isCurrentAlbum = useAlbumsStore.getState().currentAlbumNodeUid === item.uid;
            // Skip events not related to my photos or with a known non-photos parent
            if (!isMyPhotos && item.parentUid !== undefined && !isCurrentAlbum) {
                continue;
            }

            try {
                if (item.isTrashed) {
                    if (isMyPhotos) {
                        usePhotosStore.getState().removePhotoItem(item.uid);
                    }
                    // Remove from all albums that contain this photo
                    for (const [albumUid, album] of useAlbumsStore.getState().albums) {
                        if (album.photoNodeUids?.has(item.uid)) {
                            useAlbumsStore.getState().removePhotoNodeUids(albumUid, [item.uid]);
                        }
                    }
                    continue;
                }
                const node = await driveClient.getNode(item.uid);
                const { photoAttributes, albumAttributes } = getNodeEntity(node);
                if (isPhotoNode(node) && !photoAttributes && !albumAttributes) {
                    logger.warn(
                        `[subscribeToPhotosEvents] A photo/album element doesn't have photo/album attributes: ${JSON.stringify(item)}`
                    );
                    continue;
                }
                if (node.type === NodeType.Photo && photoAttributes) {
                    if (isMyPhotos) {
                        if (photoAttributes.mainPhotoNodeUid) {
                            usePhotosStore
                                .getState()
                                .addRelatedPhotoNodeUid(photoAttributes.mainPhotoNodeUid, node.uid);
                        } else {
                            const existing = usePhotosStore.getState().getPhotoItem(node.uid);
                            const mapped = mapNodeToPhotoItem(node);
                            usePhotosStore.getState().setPhotoItem({
                                nodeUid: node.uid,
                                captureTime: photoAttributes.captureTime,
                                tags: photoAttributes.tags,
                                relatedPhotoNodeUids: photoAttributes.relatedPhotoNodeUids,
                                additionalInfo: mapped?.additionalInfo ?? existing?.additionalInfo,
                            });
                        }
                    }
                    // Sync album membership for all known albums using node data
                    const currentAlbumUids = new Set(photoAttributes.albums.map((a) => a.nodeUid));
                    for (const [albumUid, album] of useAlbumsStore.getState().albums) {
                        if (currentAlbumUids.has(albumUid)) {
                            useAlbumsStore.getState().addPhotoNodeUid(albumUid, node.uid);
                        } else if (album.photoNodeUids?.has(node.uid)) {
                            useAlbumsStore.getState().removePhotoNodeUids(albumUid, [node.uid]);
                        }
                    }
                } else if (node.type === NodeType.Album && albumAttributes) {
                    useAlbumsStore.getState().upsertAlbum(nodeToAlbumItem(node, item));
                    if (!isMyPhotos || isCurrentAlbum) {
                        await loadCurrentAlbum(item.uid);
                    }
                }
            } catch (e) {
                handleSdkError(e);
            }
        }
    };

const onDeletedOrTrashedNodes = async (event: { uids: string[] }) => {
    const photosStore = usePhotosStore.getState();
    const albumStore = useAlbumsStore.getState();
    for (const uid of event.uids) {
        photosStore.removePhotoItem(uid);
        albumStore.removeAlbum(uid);
        for (const [albumUid, album] of albumStore.albums) {
            if (album.photoNodeUids?.has(uid)) {
                albumStore.removePhotoNodeUids(albumUid, [uid]);
            }
        }
    }
};

const onInvitationAccepted = async (event: { uids: string[] }, driveClient: BusDriverClient) => {
    for (const uid of event.uids) {
        try {
            const node = await driveClient.getNode(uid);
            const { albumAttributes } = getNodeEntity(node);
            if (node.type === NodeType.Album && albumAttributes) {
                useAlbumsStore.getState().upsertAlbum(nodeToAlbumItem(node, { isShared: true }));
            }
        } catch (e) {
            handleSdkError(e);
        }
    }
};

export const subscribeToPhotosEvents = async () => {
    const rootFolder = await getDriveForPhotos().getMyPhotosRootFolder();
    const photosRootNodeUid = rootFolder.uid;

    const createdOrRestoredHandler = onCreatedOrRestoredNodes(photosRootNodeUid);
    const unsubCreated = getBusDriver().subscribe(BusDriverEventName.CREATED_NODES, createdOrRestoredHandler);
    const unsubRestored = getBusDriver().subscribe(BusDriverEventName.RESTORED_NODES, createdOrRestoredHandler);
    const unsubUpdated = getBusDriver().subscribe(BusDriverEventName.UPDATED_NODES, onUpdatedNodes(photosRootNodeUid));
    const unsubDeleted = getBusDriver().subscribe(BusDriverEventName.DELETED_NODES, onDeletedOrTrashedNodes);
    const unsubTrashed = getBusDriver().subscribe(BusDriverEventName.TRASHED_NODES, onDeletedOrTrashedNodes);
    const unsubInvitation = getBusDriver().subscribe(BusDriverEventName.ACCEPT_INVITATIONS, onInvitationAccepted);

    return () => {
        unsubCreated();
        unsubRestored();
        unsubUpdated();
        unsubDeleted();
        unsubTrashed();
        unsubInvitation();
    };
};
