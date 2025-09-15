import { getDrive, splitPublicLinkUid } from '@proton/drive/index';

import type { LinkShareUrl } from '../../store';
import { getActionEventManager } from '../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../utils/ActionEventManager/ActionEventManagerTypes';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';
import { mapNodeToLegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import type { FolderViewData } from './useFolder.store';
import { useFolderStore } from './useFolder.store';

const getLegacyItemFromUid = async (uid: string, folder: FolderViewData) => {
    let legacyItem;
    let shareUrl: LinkShareUrl | undefined;
    try {
        const drive = getDrive();
        const { node } = getNodeEntity(await drive.getNode(uid));
        legacyItem = await mapNodeToLegacyItem(node, folder.shareId);
        if (node.isShared) {
            const shareResult = await drive.getSharingInfo(node.uid);
            if (shareResult && shareResult.publicLink) {
                const { shareId, publicLinkId } = splitPublicLinkUid(shareResult.publicLink.uid);
                shareUrl = {
                    id: shareId,
                    token: publicLinkId,
                    isExpired: Boolean(
                        shareResult.publicLink?.expirationTime &&
                            new Date(shareResult.publicLink.expirationTime) < new Date()
                    ),
                    url: shareResult.publicLink.url,
                    createTime: dateToLegacyTimestamp(shareResult.publicLink.creationTime),
                    expireTime: shareResult.publicLink.expirationTime
                        ? dateToLegacyTimestamp(shareResult.publicLink.expirationTime)
                        : null,
                };
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unhandled Error';
        sendErrorReport(new EnrichedError(errorMessage, { tags: { component: 'drive-sdk' }, extra: { uid } }));
    }
    return legacyItem ? { ...legacyItem, shareUrl } : undefined;
};

export const subscribeToFolderEvents = () => {
    void getActionEventManager().subscribeSdkEventsMyUpdates('folders');

    const unsubscribeFromEvents = getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
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
            case ActionEventName.TRASHED_NODES:
                event.uids.forEach((uid) => {
                    store.removeItem(uid);
                });
                break;
            case ActionEventName.RESTORED_NODES:
                event.items.forEach(async (item) => {
                    if (item.parentUid === folder.uid) {
                        const legacyItem = await getLegacyItemFromUid(item.uid, folder);
                        if (legacyItem) {
                            store.setItem(legacyItem);
                        }
                    } else {
                        store.removeItem(item.uid);
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
                event.items.forEach(async (item) => {
                    if (item.parentUid === folder.uid && !item.isTrashed) {
                        const legacyItem = await getLegacyItemFromUid(item.uid, folder);
                        if (legacyItem) {
                            store.updateItem(item.uid, legacyItem);
                        }
                    } else {
                        store.removeItem(item.uid);
                    }
                });
                break;
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
        }
    });

    return () => {
        unsubscribeFromEvents();
        void getActionEventManager().unsubscribeSdkEventsMyUpdates('folders');
    };
};
