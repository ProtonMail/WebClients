import { getDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { logging } from '../../modules/logging';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { mapNodeToFolderViewItem } from './mapNodeToFolderViewItem';
import type { FolderStore, FolderViewData } from './useFolder.store';
import { useFolderStore } from './useFolder.store';

export const folderLogger = logging.getLogger('folder');

const getFolderViewItemFromUid = async (uid: string, folder: FolderViewData) => {
    try {
        const drive = getDrive();
        const maybeNode = await drive.getNode(uid);
        return await mapNodeToFolderViewItem(maybeNode, folder.shareId, drive);
    } catch (error) {
        handleSdkError(error, { showNotification: false, fallbackMessage: 'Unhandled Error', extra: { uid } });
    }
    return undefined;
};

const addFolderItemToStore = async (uid: string, folder: FolderViewData, folderStore: FolderStore) => {
    const item = await getFolderViewItemFromUid(uid, folder);
    if (item) {
        folderStore.setItem(item);
    }
};

export const subscribeToFolderEvents = () => {
    void getBusDriver().subscribeSdkEventsMyUpdates('folders');

    const unsubscribeFromEvents = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
        const store = useFolderStore.getState();
        const { folder } = store;

        if (!folder) {
            folderLogger.warn(`Event received before folder was loaded ${JSON.stringify(event)}`);
            return;
        }
        switch (event.type) {
            case BusDriverEventName.RENAMED_NODES:
                for (const item of event.items) {
                    store.updateItem(item.uid, { name: item.newName });
                }
                break;
            case BusDriverEventName.TRASHED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                break;
            case BusDriverEventName.RESTORED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case BusDriverEventName.MOVED_NODES:
                for (const item of event.items) {
                    if (item.parentUid !== folder.uid) {
                        store.removeItem(item.uid);
                    } else {
                        void addFolderItemToStore(item.uid, folder, store);
                    }
                }
                break;

            case BusDriverEventName.UPDATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case BusDriverEventName.CREATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case BusDriverEventName.DELETED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getBusDriver().unsubscribeSdkEventsMyUpdates('folders');
    };
};
