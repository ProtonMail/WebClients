import { getDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity, isPhotoNode } from '../../utils/sdk/getNodeEntity';
import { trashLogDebug } from './trashLogger';
import { useTrashStore } from './useTrash.store';
import { useTrashPhotosStore } from './useTrashPhotos.store';

const getNode = async (uid: string) => {
    const drive = getDrive();
    try {
        const maybeNode = await drive.getNode(uid);
        const { node } = getNodeEntity(maybeNode);
        return node;
    } catch (error) {
        handleSdkError(error, { showNotification: false, fallbackMessage: 'Unhandled Error', extra: { uid } });
    }
};

export const subscribeToTrashEvents = () => {
    const eventManager = getBusDriver();
    void eventManager.subscribeSdkEventsMyUpdates('trashFiles');
    void eventManager.subscribePhotosEventsMyUpdates('trashPhotos');
    const unsubscribeFromEvents = eventManager.subscribe(BusDriverEventName.ALL, async (event) => {
        const trashPhotoStore = useTrashPhotosStore.getState();
        const trashFilesStore = useTrashStore.getState();
        trashLogDebug('trash event', { event });
        switch (event.type) {
            case BusDriverEventName.RESTORED_NODES:
                const uids = event.items.map((t) => t.uid);
                trashPhotoStore.removeNodes(uids);
                trashFilesStore.removeNodes(uids);
                break;
            case BusDriverEventName.TRASHED_NODES:
                for (const uid of event.uids) {
                    const node = await getNode(uid);
                    if (node) {
                        if (isPhotoNode(node)) {
                            trashPhotoStore.addNode(node);
                        } else {
                            trashFilesStore.addNode(node);
                        }
                    }
                }
                break;
            case BusDriverEventName.DELETED_NODES:
                trashPhotoStore.removeNodes(event.uids);
                trashFilesStore.removeNodes(event.uids);
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getBusDriver().unsubscribeSdkEventsMyUpdates('trashFiles');
        void getBusDriver().unsubscribePhotosEventsMyUpdates('trashPhotos');
    };
};
