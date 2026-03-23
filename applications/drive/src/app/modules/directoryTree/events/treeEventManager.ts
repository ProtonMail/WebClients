import { NodeType, getDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getDeviceName } from '../../../utils/sdk/getNodeName';
import { DEVICES_ROOT_ID, SHARED_WITH_ME_ROOT_ID, getNodeUidFromTreeItemId, makeTreeItemId } from '../helpers';
import { DirectoryTreeRootType } from '../types';
import type { DirectoryTreeStore, TreeStoreItem } from '../types';
import { iterateSharedWithMeNodes } from './iterateSharedWithMeNodes';

export type Section = 'myFiles' | 'devices' | 'sharedWithMe';

export class TreeEventManager {
    private store: DirectoryTreeStore;
    private context: string;

    private expandedSections: Set<Section> = new Set();
    private expandedTreeEventScopeIds: Set<string> = new Set();

    private isDriveSubscribed = false;
    private subscribedTreeEventScopeIds = new Set<string>();
    private unsubBusDriver: (() => void) | null = null;

    constructor(store: DirectoryTreeStore, context: string) {
        this.store = store;
        this.context = context;
        this.startListener();
    }

    syncSubscriptions() {
        const { expandedTreeIds: allExpanded, items: freshItems } = this.store.getState();
        const sections: Section[] = [];
        const scopes: string[] = [];

        for (const [treeId, isExpanded] of allExpanded) {
            const nodeUid = getNodeUidFromTreeItemId(treeId);
            if (!isExpanded || !nodeUid) {
                continue;
            }
            const storeItem = freshItems.get(nodeUid);
            if (!storeItem) {
                continue;
            }
            if (storeItem.type === DirectoryTreeRootType.FilesRoot) {
                sections.push('myFiles');
            } else if (storeItem.type === DirectoryTreeRootType.DevicesRoot) {
                sections.push('devices');
            } else if (storeItem.type === DirectoryTreeRootType.SharesRoot) {
                sections.push('sharedWithMe');
            } else if (storeItem.treeEventScopeId) {
                scopes.push(storeItem.treeEventScopeId);
            }
        }

        this.expandedSections = new Set(sections);
        this.expandedTreeEventScopeIds = new Set(scopes);
        this.reconcile();
    }

    destroy() {
        this.expandedSections = new Set();
        this.expandedTreeEventScopeIds = new Set();
        if (this.unsubBusDriver) {
            this.unsubBusDriver();
            this.unsubBusDriver = null;
        }
        this.reconcile();
    }

    private reconcile() {
        const wantShared = this.expandedSections.has('sharedWithMe');
        const desiredScopes = new Set(this.expandedTreeEventScopeIds);

        if (wantShared && !this.isDriveSubscribed) {
            this.isDriveSubscribed = true;
            void getBusDriver().subscribeSdkDriveEvents(this.context);
        } else if (!wantShared && this.isDriveSubscribed) {
            this.isDriveSubscribed = false;
            void getBusDriver().unsubscribeSdkDriveEvents(this.context);
        }

        for (const scope of desiredScopes) {
            if (!this.subscribedTreeEventScopeIds.has(scope)) {
                getBusDriver().subscribeSdkEventsScope(scope, this.context);
                this.subscribedTreeEventScopeIds.add(scope);
            }
        }
        for (const scope of [...this.subscribedTreeEventScopeIds]) {
            if (!desiredScopes.has(scope)) {
                void getBusDriver().unsubscribeSdkEventsScope(scope, this.context);
                this.subscribedTreeEventScopeIds.delete(scope);
            }
        }
    }

    // Only nodes that are folders and which parents are expanded should be updated
    private async getUpdatableNode(item: { uid: string; parentUid?: string }) {
        const { items, expandedTreeIds } = this.store.getState();
        const parentTreeId = items.get(item.parentUid ?? '')?.treeItemId ?? '';
        if (!expandedTreeIds.size || !expandedTreeIds.get(parentTreeId)) {
            return null;
        }

        const { node } = getNodeEntity(await getDrive().getNode(item.uid));
        return node.type === NodeType.Folder ? node : null;
    }

    // Remove scope when the last store item using it is deleted.
    private removeScopeIfUnused(uid: string) {
        const { items } = this.store.getState();
        const item = items.get(uid);
        if (item?.treeEventScopeId) {
            const scopeStillNeeded = [...items.values()].some(
                (i) => i.nodeUid !== uid && i.treeEventScopeId === item.treeEventScopeId
            );
            if (!scopeStillNeeded) {
                this.expandedTreeEventScopeIds.delete(item.treeEventScopeId);
            }
        }
    }

    private async ensureDeviceInStore(rootUid: string) {
        const drive = getDrive();
        const { items, addItem } = this.store.getState();
        if (items.has(rootUid) || typeof drive.iterateDevices !== 'function') {
            return;
        }
        for await (const device of drive.iterateDevices()) {
            if (device.rootFolderUid !== rootUid) {
                continue;
            }
            addItem({
                nodeUid: rootUid,
                treeItemId: makeTreeItemId(DEVICES_ROOT_ID, rootUid),
                parentUid: DEVICES_ROOT_ID,
                name: getDeviceName(device),
                type: DirectoryTreeRootType.Device,
                expandable: true,
                isSharedWithMe: false,
            });
            break;
        }
    }

    private startListener() {
        // The error is caught at the emit level of BusDriver, that's why we don't have it here for the moment
        this.unsubBusDriver = getBusDriver().subscribe(BusDriverEventName.ALL, async (event) => {
            const { addItem, removeItem, updateItem, items } = this.store.getState();
            switch (event.type) {
                case BusDriverEventName.RENAMED_NODES:
                    for (const { uid, newName } of event.items) {
                        updateItem(uid, { name: newName });
                    }
                    break;

                case BusDriverEventName.TRASHED_NODES:
                case BusDriverEventName.DELETED_NODES:
                    for (const uid of event.uids) {
                        this.removeScopeIfUnused(uid);
                        removeItem(uid);
                    }
                    this.reconcile();
                    break;

                case BusDriverEventName.UPDATED_NODES:
                    for (const item of event.items) {
                        if (item.isTrashed) {
                            this.removeScopeIfUnused(item.uid);
                            removeItem(item.uid);
                        } else {
                            const node = await this.getUpdatableNode(item);
                            if (node) {
                                updateItem(item.uid, {
                                    ...node,
                                    treeItemId: makeTreeItemId(item.parentUid || null, item.uid),
                                });
                            }
                        }
                        this.reconcile();
                    }
                    break;

                case BusDriverEventName.MOVED_NODES:
                    for (const item of event.items) {
                        if (items.has(item.uid)) {
                            updateItem(item.uid, {
                                parentUid: item.parentUid,
                                treeItemId: makeTreeItemId(item.parentUid || null, item.uid),
                            });
                        } else {
                            const node = await this.getUpdatableNode(item);
                            if (node) {
                                const isSharedWithMe = items.get(item.parentUid ?? '')?.isSharedWithMe ?? false;
                                addItem({
                                    nodeUid: node.uid,
                                    treeItemId: makeTreeItemId(node.parentUid ?? null, node.uid),
                                    parentUid: node.parentUid ?? null,
                                    name: node.name,
                                    type: NodeType.Folder,
                                    expandable: true,
                                    isSharedWithMe: isSharedWithMe,
                                });
                            }
                        }
                    }
                    break;

                case BusDriverEventName.CREATED_NODES:
                case BusDriverEventName.RESTORED_NODES:
                    for (const item of event.items) {
                        // Complex logic just to know if this node is the root of a new shared folder
                        // currently we don't have a better way of knowing
                        // TODO: one improvement would be if events had rootScopeId
                        let isSharedWithMe = true;
                        if (!item.parentUid) {
                            const { node: rootNode } = getNodeEntity(await getDrive().getMyFilesRootFolder());
                            if (item.uid === rootNode.uid) {
                                // This is myfiles root
                                isSharedWithMe = false;
                            } else {
                                const { node } = getNodeEntity(await getDrive().getNode(item.uid));
                                if (node.treeEventScopeId === rootNode.treeEventScopeId) {
                                    // This is a device root
                                    isSharedWithMe = false;
                                }
                            }
                        } else {
                            // If it's not a root node we can simply check if the parent is a shared folder
                            isSharedWithMe = items.get(item.parentUid)?.isSharedWithMe ?? false;
                        }

                        if (this.expandedSections.has('devices') && !isSharedWithMe) {
                            await this.ensureDeviceInStore(item.uid);
                        }

                        // Add as a new folder node (myFiles or folder scope sections)
                        const node = await this.getUpdatableNode(item);
                        if (node) {
                            addItem({
                                nodeUid: node.uid,
                                treeItemId: makeTreeItemId(node.parentUid || null, node.uid),
                                parentUid: node.parentUid || null,
                                name: node.name,
                                type: NodeType.Folder,
                                expandable: true,
                                isSharedWithMe: isSharedWithMe,
                            });
                        }
                    }
                    break;

                case BusDriverEventName.RENAMED_DEVICES:
                    if (this.expandedSections.has('devices')) {
                        for (const { deviceUid, newName } of event.items) {
                            updateItem(deviceUid, { name: newName });
                        }
                    }
                    break;

                case BusDriverEventName.REMOVED_DEVICES:
                    if (this.expandedSections.has('devices')) {
                        for (const deviceUid of event.deviceUids) {
                            removeItem(deviceUid);
                        }
                    }
                    break;

                case BusDriverEventName.REFRESH_SHARED_WITH_ME:
                    if (this.expandedSections.has('sharedWithMe')) {
                        const newShared = (await iterateSharedWithMeNodes()).map(({ node: { uid, name, type } }) => ({
                            nodeUid: uid,
                            name,
                            type,
                        }));
                        const currentShared = this.store.getState().getItemsByParentUid(SHARED_WITH_ME_ROOT_ID);
                        this.sharedRootsReconciliation(currentShared, newShared);
                    }
                    break;
            }
        });
    }

    private sharedRootsReconciliation(
        currentShared: TreeStoreItem[],
        newShared: Pick<TreeStoreItem, 'nodeUid' | 'name' | 'type'>[]
    ) {
        const { addItem, removeItem, updateItem } = this.store.getState();

        const newByUid = new Map(newShared.map((item) => [item.nodeUid, item]));
        const currentByUid = new Map(currentShared.map((item) => [item.nodeUid, item]));

        for (const uid of currentByUid.keys()) {
            if (!newByUid.has(uid)) {
                removeItem(uid);
            }
        }

        for (const [uid, newItem] of newByUid) {
            const existing = currentByUid.get(uid);
            if (!existing) {
                addItem({
                    nodeUid: uid,
                    treeItemId: makeTreeItemId(SHARED_WITH_ME_ROOT_ID, uid),
                    parentUid: SHARED_WITH_ME_ROOT_ID,
                    name: newItem.name,
                    type: newItem.type,
                    expandable: newItem.type === NodeType.Folder,
                    isSharedWithMe: true,
                });
            } else if (existing.name !== newItem.name) {
                updateItem(uid, { name: newItem.name });
            }
        }
    }
}
