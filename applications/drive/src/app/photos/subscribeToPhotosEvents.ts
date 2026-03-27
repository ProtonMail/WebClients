import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { usePhotosStore } from './usePhotos.store';
import { createPhotoItemsFromNode } from './utils/createPhotoItemsFromNode';

export const subscribeToPhotosEvents = () => {
    const handleCreatedOrRestoredNodes = async (event: { items: { uid: string }[] }) => {
        const store = usePhotosStore.getState();
        const nodeUids = event.items.filter((item) => !store.photoTimelineUids.has(item.uid)).map((item) => item.uid);
        const photoItems = await createPhotoItemsFromNode(nodeUids);
        if (photoItems) {
            store.setPhotoItems(photoItems);
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
        const store = usePhotosStore.getState();
        const timelineUids: string[] = [];
        const albumOnlyUids: string[] = [];

        for (const item of event.items) {
            const inTimeline = store.photoTimelineUids.has(item.uid);
            const inAlbum = store.albumPhotoUids.has(item.uid);
            if (!inTimeline && !inAlbum) {
                continue;
            }
            if (item.isTrashed) {
                store.removePhotoItem(item.uid);
                continue;
            }
            if (inTimeline) {
                timelineUids.push(item.uid);
            } else {
                albumOnlyUids.push(item.uid);
            }
        }

        const [timelineItems, albumOnlyItems] = await Promise.all([
            createPhotoItemsFromNode(timelineUids),
            createPhotoItemsFromNode(albumOnlyUids),
        ]);
        if (timelineItems) {
            store.setPhotoItems(timelineItems);
        }
        if (albumOnlyItems) {
            for (const item of albumOnlyItems) {
                store.setPhotoItemWithoutTimeline(item);
            }
        }
    });

    const handleRemovedNodes = async (event: { uids: string[] }) => {
        const store = usePhotosStore.getState();
        for (const uid of event.uids) {
            store.removePhotoItem(uid);
        }
    };

    const deletedSubscription = getBusDriver().subscribe(BusDriverEventName.DELETED_NODES, handleRemovedNodes);
    const trashedSubscription = getBusDriver().subscribe(BusDriverEventName.TRASHED_NODES, handleRemovedNodes);

    return () => {
        createdSubscription();
        restoredSubscription();
        updatedSubscription();
        deletedSubscription();
        trashedSubscription();
    };
};
