import { getDrive } from '@proton/drive/index';

import { logging } from '../../modules/logging';
import type { LinkShareUrl } from '../../store';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import type { FolderStore, FolderViewData } from './useFolder.store';
import { useFolderStore } from './useFolder.store';

export const folderLogger = logging.getLogger('folder');

const getLegacyItemFromUid = async (uid: string, folder: FolderViewData) => {
    let legacyItem;
    let shareUrl: LinkShareUrl | undefined;
    try {
        const drive = getDrive();
        const maybeNode = await drive.getNode(uid);
        legacyItem = await mapNodeToLegacyItem(maybeNode, folder.shareId);
    } catch (error) {
        handleSdkError(error, { fallbackMessage: 'Unhandled Error', extra: { uid } });
    }
    return legacyItem ? { ...legacyItem, shareUrl } : undefined;
};

const addFolderItemToStore = async (uid: string, folder: FolderViewData, folderStore: FolderStore) => {
    const legacyItem = await getLegacyItemFromUid(uid, folder);
    if (legacyItem) {
        folderStore.setItem(legacyItem);
    }
};

export const subscribeToFolderEvents = () => {
    void getActionEventManager().subscribeSdkEventsMyUpdates('folders');

    const unsubscribeFromEvents = getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
        const store = useFolderStore.getState();
        const { folder } = store;

        // TODO: delete this condition and any requirement to have the full legacy folder
        // once the FileBrowser is migrated to the new version not needing LegacyItems
        if (!folder) {
            folderLogger.warn(`Event received before folder was loaded ${JSON.stringify(event)}`);
            return;
        }
        switch (event.type) {
            case ActionEventName.RENAMED_NODES:
                for (const item of event.items) {
                    store.updateItem(item.uid, { name: item.newName });
                }
                break;
            case ActionEventName.TRASHED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                break;
            case ActionEventName.RESTORED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case ActionEventName.MOVED_NODES:
                for (const item of event.items) {
                    if (item.parentUid !== folder.uid) {
                        store.removeItem(item.uid);
                    } else {
                        void addFolderItemToStore(item.uid, folder, store);
                    }
                }
                break;

            case ActionEventName.UPDATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case ActionEventName.CREATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        void addFolderItemToStore(item.uid, folder, store);
                    } else {
                        store.removeItem(item.uid);
                    }
                }
                break;
            case ActionEventName.DELETED_NODES:
                for (const uid of event.uids) {
                    store.removeItem(uid);
                }
                break;
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getActionEventManager().unsubscribeSdkEventsMyUpdates('folders');
    };
};
