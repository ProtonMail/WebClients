import { NodeType, getDrive } from '@proton/drive/index';

import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { sendErrorReport } from '../../../utils/errorHandling';
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
                    const sidebarItem = await getSidebarItemFromUid(item.uid);
                    if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
                    }
                }
                break;
            case ActionEventName.MOVED_NODES:
                for (const item of event.items) {
                    const itemExists = !!store.getItem(item.uid);
                    if (itemExists && item.parentUid) {
                        const parent = store.getItem(item.parentUid);
                        if (parent) {
                            store.updateItem(item.uid, { parentUid: item.parentUid, level: parent.level + 1 });
                        } else {
                            sendErrorReport('Sidebar item in store but its parent is not', {
                                extra: { parentUid: item.parentUid, itemUid: item.uid },
                            });
                        }
                    } else if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        const sidebarItem = await getSidebarItemFromUid(item.uid);
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
                    }
                }
                break;

            case ActionEventName.UPDATED_NODES:
            case ActionEventName.CREATED_NODES:
                for (const item of event.items) {
                    if (item.parentUid && store.getItem(item.parentUid)?.isExpanded) {
                        const sidebarItem = await getSidebarItemFromUid(item.uid);
                        if (sidebarItem) {
                            store.setItem(sidebarItem);
                        }
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
        void getActionEventManager().unsubscribeSdkEventsMyUpdates('sidebar');
    };
};
