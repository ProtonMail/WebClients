import { getDriveForPhotos } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../utils/sdk/getNodeEntity';
import { refreshAlbumMetadata } from './loaders/loadAlbum';
import { useAlbumsStore } from './useAlbums.store';
import { usePhotosStore } from './usePhotos.store';
import { createPhotoItemsFromNode } from './utils/createPhotoItemsFromNode';

export const subscribeToPhotosEvents = () => {
    const handleCreatedOrRestoredNodes = async (event: { items: { uid: string; parentUid?: string }[] }) => {
        const photosRootFolder = await getDriveForPhotos().getMyPhotosRootFolder();
        if (!photosRootFolder.ok) {
            return;
        }
        const photosRootUid = photosRootFolder.value.uid;

        const photosStore = usePhotosStore.getState();
        const albumStore = useAlbumsStore.getState();
        const currentAlbumNodeUid = albumStore.currentAlbum?.nodeUid;

        const timelineNodeUids: string[] = [];
        const albumNodeUids: string[] = [];

        for (const item of event.items) {
            const isNewTimelinePhoto = item.parentUid === photosRootUid && !photosStore.photoTimelineUids.has(item.uid);
            const isNewAlbumPhoto =
                currentAlbumNodeUid &&
                item.parentUid === currentAlbumNodeUid &&
                !albumStore.currentAlbum?.photoNodeUids?.has(item.uid);

            if (isNewTimelinePhoto) {
                timelineNodeUids.push(item.uid);
            } else if (isNewAlbumPhoto) {
                albumNodeUids.push(item.uid);
            }
        }

        const [timelineItems, albumItems] = await Promise.all([
            timelineNodeUids.length ? createPhotoItemsFromNode(timelineNodeUids) : null,
            albumNodeUids.length ? createPhotoItemsFromNode(albumNodeUids) : null,
        ]);

        if (timelineItems) {
            photosStore.setPhotoItems(timelineItems);
        }
        if (albumItems && currentAlbumNodeUid) {
            for (const item of albumItems) {
                photosStore.setPhotoItemWithoutTimeline(item);
            }
            albumStore.addPhotoNodeUids(albumNodeUids);
            void refreshAlbumMetadata(currentAlbumNodeUid);
        }
    };

    const createdSubscription = getBusDriver().subscribe(
        BusDriverEventName.CREATED_NODES,
        handleCreatedOrRestoredNodes
    );

    const restoredSubscription = getBusDriver().subscribe(
        BusDriverEventName.RESTORED_NODES,
        handleCreatedOrRestoredNodes
    );

    const updatedSubscription = getBusDriver().subscribe(BusDriverEventName.UPDATED_NODES, async (event) => {
        const photosStore = usePhotosStore.getState();
        const albumStore = useAlbumsStore.getState();
        const timelineUids: string[] = [];
        const albumOnlyUids: string[] = [];
        for (const item of event.items) {
            const inAlbum = albumStore.currentAlbum?.photoNodeUids?.has(item.uid) ?? false;
            const isAlbumNode = albumStore.currentAlbum?.nodeUid == item.uid;
            // TODO: Update that as we probably can do it differently instead of loading the root
            const getIsInTimeline = async () =>
                photosStore.photoTimelineUids.has(item.uid) ||
                getNodeEntity(await getDriveForPhotos().getMyPhotosRootFolder()).node.uid === item.parentUid;
            if (!inAlbum && !isAlbumNode && !(await getIsInTimeline())) {
                continue;
            }
            if (item.isTrashed) {
                photosStore.removePhotoItem(item.uid);
                continue;
            }
            if (inAlbum) {
                albumOnlyUids.push(item.uid);
            } else if (isAlbumNode) {
                void refreshAlbumMetadata(item.uid);
            } else {
                timelineUids.push(item.uid);
            }
        }

        const [timelineItems, albumOnlyItems] = await Promise.all([
            timelineUids.length ? createPhotoItemsFromNode(timelineUids) : null,
            albumOnlyUids.length ? createPhotoItemsFromNode(albumOnlyUids) : null,
        ]);
        if (timelineItems) {
            photosStore.setPhotoItems(timelineItems);
        }
        if (albumOnlyItems) {
            for (const item of albumOnlyItems) {
                photosStore.setPhotoItemWithoutTimeline(item);
            }
            if (albumStore.currentAlbum) {
                void refreshAlbumMetadata(albumStore.currentAlbum.nodeUid);
            }
        }
    });

    const handleRemovedNodes = async (event: { uids: string[] }) => {
        const photosStore = usePhotosStore.getState();
        for (const uid of event.uids) {
            photosStore.removePhotoItem(uid);
        }
    };

    const deletedSubscription = getBusDriver().subscribe(BusDriverEventName.DELETED_NODES, handleRemovedNodes);
    const trashedSubscription = getBusDriver().subscribe(BusDriverEventName.TRASHED_NODES, handleRemovedNodes);

    const acceptedInvitationsSubscription = getBusDriver().subscribe(
        BusDriverEventName.ACCEPT_INVITATIONS,
        async (event) => {
            await Promise.all(event.uids.map((uid) => refreshAlbumMetadata(uid).catch((e) => handleSdkError(e))));
        }
    );

    return () => {
        createdSubscription();
        restoredSubscription();
        updatedSubscription();
        deletedSubscription();
        trashedSubscription();
        acceptedInvitationsSubscription();
    };
};
