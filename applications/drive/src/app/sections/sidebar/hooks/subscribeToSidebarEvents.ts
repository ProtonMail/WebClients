import { NodeType, getDrive } from '@proton/drive/index';

import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { handleSdkError } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { useSidebarStore } from './useSidebar.store';

// TODO:SDK if the sdk returned in event data the node type this function could be greatly optimized
const getSidebarItemFromUid = async (uid: string) => {
    try {
        const store = useSidebarStore.getState();
        const drive = getDrive();
        const { node } = getNodeEntity(await drive.getNode(uid));

        // If the parent node is not in the store, this folder will not show up anyway
        const parent = node.parentUid && store.getItem(node.parentUid);
        if (parent && node.type === NodeType.Folder) {
            return {
                uid: node.uid,
                parentUid: node.parentUid,
                name: node.name,
                isLoading: false,
                isExpanded: false,
                level: parent.level + 1,
                hasLoadedChildren: false,
            };
        }
    } catch (error) {
        handleSdkError(error, { fallbackMessage: 'Error while getting the sidebar node', extra: { uid } });
    }
};

export const subscribeToSidebarEvents = () => {
    void getActionEventManager().subscribeSdkEventsMyUpdates('sidebar');

    const unsubscribeFromEvents = getActionEventManager().subscribe(ActionEventName.ALL, async (event) => {
        const store = useSidebarStore.getState();

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
                    const sidebarItem = await getSidebarItemFromUid(item.uid);
                    if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
                    }
                });
                break;
            case ActionEventName.MOVED_NODES:
                event.items.forEach(async (item) => {
                    const itemExists = !!store.getItem(item.uid);
                    if (itemExists) {
                        store.updateItem(item.uid, { parentUid: item.parentUid });
                    } else if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        const sidebarItem = await getSidebarItemFromUid(item.uid);
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
                    }
                });
                break;

            case ActionEventName.UPDATED_NODES:
            case ActionEventName.CREATED_NODES:
                event.items.forEach(async (item) => {
                    if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        const sidebarItem = await getSidebarItemFromUid(item.uid);
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
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
        getActionEventManager().unsubscribeSdkEventsMyUpdates('sidebar');
    };
};
