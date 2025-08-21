import { getDrive } from '@proton/drive/index';

import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import type { FolderViewData } from './useFolder.store';
import { useFolderStore } from './useFolder.store';

const getLegacyItemFromUid = async (uid: string, folder: FolderViewData) => {
    let legacyItem;
    try {
        const drive = getDrive();
        const { node } = getNodeEntity(await drive.getNode(uid));
        legacyItem = await mapNodeToLegacyItem(node, folder.shareId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unhandled Error';
        sendErrorReport(new EnrichedError(errorMessage, { tags: { component: 'drive-sdk' }, extra: { uid } }));
    }
    return legacyItem;
};

export const subscribeToFolderEvents = () =>
    getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
        const store = useFolderStore.getState();
        const { folder } = store;
        if (!folder) {
            const errorMessage = 'Event emitted before folder has been loaded';
            const error = new EnrichedError(errorMessage, {
                tags: { component: 'client-fe' },
                extra: { eventType: event.type },
            });
            sendErrorReport(error);
            console.error(errorMessage, event);
            return;
        }
        switch (event.type) {
            case ActionEventName.RENAMED_NODES:
                event.items.forEach((item) => {
                    store.updateItem(item.uid, { name: item.newName });
                });
                break;
            case ActionEventName.SHARE_CHANGED_NODES:
                event.items.forEach((item) => {
                    store.updateItem(item.uid, { isShared: item.isShared });
                });
                break;
            case ActionEventName.TRASHED_NODES:
                event.uids.forEach((uid) => {
                    store.removeItem(uid);
                });
                break;
            case ActionEventName.RESTORED_NODES:
                event.uids.forEach(async (uid) => {
                    const legacyItem = await getLegacyItemFromUid(uid, folder);
                    if (legacyItem?.parentUid === folder.uid) {
                        store.setItem(legacyItem);
                    } else {
                        store.removeItem(uid);
                    }
                });
                break;
            case ActionEventName.MOVED_NODES:
                event.items.forEach((item) => {
                    if (item.parentUid !== folder.uid) {
                        store.removeItem(item.uid);
                    }
                });
                break;

            case ActionEventName.UPDATED_NODES:
            case ActionEventName.CREATED_NODES:
                event.items.forEach(async (item) => {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        const legacyItem = await getLegacyItemFromUid(item.uid, folder);
                        if (legacyItem) {
                            store.setItem(legacyItem);
                        }
                    } else {
                        store.removeItem(item.uid);
                    }
                });
                break;
            case ActionEventName.DELETED_NODES:
                event.uids.forEach((uid) => {
                    store.removeItem(uid);
                });
                break;

            default:
                console.warn('Unhandled folders UI event', event);
        }
    });
