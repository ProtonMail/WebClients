import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { MemberRole, NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getDeviceName } from '../../utils/sdk/getNodeName';
import { directoryTreeStoreFactory } from './directoryTreeStoreFactory';
import { iterateSharedWithMeNodes } from './events/iterateSharedWithMeNodes';
import { TreeEventManager } from './events/treeEventManager';
import {
    DEVICES_ROOT_ID,
    SHARED_WITH_ME_ROOT_ID,
    findEffectiveRole,
    getNodeUidFromTreeItemId,
    makeTreeItemId,
} from './helpers';
import { toTree } from './toTree';
import type { DirectoryTreeStore } from './types';
import { DirectoryTreeRootType } from './types';

interface DirectoryTreeOptions {
    onlyFolders?: boolean;
    loadPermissions?: boolean;
    treeRootsStrategy?: TreeRootsStrategy;
    hideSharedWithMe?: boolean;
}

type TreeRootsStrategy =
    // Show all root sections: My Files, Computers, and Shared with me
    | { type: 'ALL_ROOTS' }
    // Start the tree from a specific node (e.g. a subfolder)
    | { type: 'FROM_NODE'; rootNodeUid: string };

function useDirectoryTree(
    useDirectoryTreeStore: DirectoryTreeStore,
    eventManager: TreeEventManager,
    options?: DirectoryTreeOptions
) {
    const { drive } = useDrive();

    const { items, addItem, expandedTreeIds, changeExpanded, updateItem } = useDirectoryTreeStore(
        useShallow((state) => ({
            items: state.items,
            addItem: state.addItem,
            expandedTreeIds: state.expandedTreeIds,
            changeExpanded: state.setExpanded,
            updateItem: state.updateItem,
        }))
    );

    const addNode = useCallback(
        async (nodeUid: string, parentFolderUid: string, name: string) => {
            const maybeNode = await drive.getNode(nodeUid);

            const { type, deprecatedShareId } = getNodeEntity(maybeNode).node;

            const highestEffectiveRole = options?.loadPermissions
                ? await findEffectiveRole(drive, maybeNode.ok ? maybeNode.value : maybeNode.error)
                : undefined;

            addItem({
                nodeUid,
                treeItemId: makeTreeItemId(parentFolderUid, nodeUid),
                name,
                type,
                parentUid: parentFolderUid,
                expandable: type === NodeType.Folder,
                isSharedWithMe: false,
                highestEffectiveRole,
                deprecatedShareId,
            });
        },
        [addItem, drive, options?.loadPermissions]
    );

    const loadDevices = useCallback(
        async (abortSignal: AbortSignal) => {
            try {
                for await (const device of drive.iterateDevices(abortSignal)) {
                    addItem({
                        nodeUid: device.rootFolderUid,
                        treeItemId: makeTreeItemId(DEVICES_ROOT_ID, device.rootFolderUid),
                        parentUid: DEVICES_ROOT_ID,
                        name: getDeviceName(device),
                        type: DirectoryTreeRootType.Device,
                        expandable: true,
                        isSharedWithMe: false,
                        deprecatedShareId: device.shareId,
                    });
                }
            } catch (error) {
                handleSdkError(error, { fallbackMessage: 'Failed to load devices' });
                throw error;
            }
        },
        [addItem, drive]
    );

    const loadSharedWithMe = useCallback(
        async (abortSignal: AbortSignal) => {
            for (const { node } of await iterateSharedWithMeNodes(abortSignal)) {
                const { uid, name, type, treeEventScopeId, deprecatedShareId } = node;

                if (options?.onlyFolders && type !== NodeType.Folder) {
                    continue;
                }

                const highestEffectiveRole = options?.loadPermissions
                    ? await findEffectiveRole(drive, node)
                    : undefined;
                addItem({
                    nodeUid: uid,
                    treeItemId: makeTreeItemId(SHARED_WITH_ME_ROOT_ID, uid),
                    parentUid: SHARED_WITH_ME_ROOT_ID,
                    name,
                    type,
                    expandable: type === NodeType.Folder,
                    isSharedWithMe: true,
                    highestEffectiveRole,
                    treeEventScopeId,
                    deprecatedShareId,
                });
            }
        },
        [drive, options?.onlyFolders, options?.loadPermissions, addItem]
    );

    const loadChildren = useCallback(
        async (parentUid: string, abortSignal: AbortSignal) => {
            const maybeItem = useDirectoryTreeStore.getState().items.get(parentUid);
            if (!maybeItem) {
                const error = new Error(c('Error').t`Failed to expand folder`);
                sendErrorReport(error, { extra: { message: 'Loading children of non-existent directory tree item' } });
                throw error;
            }
            if (maybeItem.expandable === false) {
                const error = new Error(c('Error').t`Failed to expand folder`);
                sendErrorReport(error, { extra: { message: 'Loading children of non-existent directory tree item' } });
                throw error;
            }

            if (parentUid === DEVICES_ROOT_ID) {
                await loadDevices(abortSignal);
                const hasChildren = useDirectoryTreeStore.getState().getItemsByParentUid(parentUid).length > 0;
                updateItem(parentUid, { hasLoadedChildren: true, hasChildren });
                return;
            }

            if (parentUid === SHARED_WITH_ME_ROOT_ID) {
                await loadSharedWithMe(abortSignal);
                const hasChildren = useDirectoryTreeStore.getState().getItemsByParentUid(parentUid).length > 0;
                updateItem(parentUid, { hasLoadedChildren: true, hasChildren });
                return;
            }

            try {
                const iterateOptions = options?.onlyFolders ? { type: NodeType.Folder } : undefined;
                for await (const node of drive.iterateFolderChildren(parentUid, iterateOptions, abortSignal)) {
                    const { uid, name, type, treeEventScopeId, deprecatedShareId } = getNodeEntity(node).node;
                    const highestEffectiveRole = options?.loadPermissions
                        ? await findEffectiveRole(drive, node.ok ? node.value : node.error)
                        : undefined;
                    const existingItem = useDirectoryTreeStore.getState().items.get(uid);
                    addItem({
                        nodeUid: uid,
                        parentUid,
                        treeItemId: makeTreeItemId(parentUid, uid),
                        treeEventScopeId,
                        name,
                        type,
                        expandable: type === NodeType.Folder,
                        // We need to preserve value between item displayed in the root of shares and deeply nested child that is also shared.
                        isSharedWithMe: existingItem?.isSharedWithMe ?? false,
                        highestEffectiveRole,
                        deprecatedShareId,
                    });
                }
            } catch (error) {
                handleSdkError(error, {
                    fallbackMessage: 'Failed to expand folder',
                    extra: { uid: parentUid },
                });
                throw error;
            } finally {
                const hasChildren = useDirectoryTreeStore.getState().getItemsByParentUid(parentUid).length > 0;
                updateItem(parentUid, { hasLoadedChildren: true, hasChildren });
            }
        },
        [
            useDirectoryTreeStore,
            loadDevices,
            loadSharedWithMe,
            options?.onlyFolders,
            options?.loadPermissions,
            drive,
            addItem,
            updateItem,
        ]
    );

    const expandAbortControllers = useRef(new Map<string, AbortController>());
    const toggleExpand = useCallback(
        async (treeItemId: string) => {
            const shouldExpand = !expandedTreeIds.get(treeItemId);
            const uid = getNodeUidFromTreeItemId(treeItemId);
            if (!uid) {
                return;
            }

            if (shouldExpand) {
                changeExpanded(treeItemId, true);
                eventManager.syncSubscriptions();
                const controller = new AbortController();
                expandAbortControllers.current.set(treeItemId, controller);
                try {
                    await loadChildren(uid, controller.signal);
                } catch (error) {
                    sendErrorReport(error);
                }
            } else {
                // Cancel ongoing work when collapsing
                expandAbortControllers.current.get(treeItemId)?.abort();
                expandAbortControllers.current.delete(treeItemId);
                changeExpanded(treeItemId, false);
                eventManager.syncSubscriptions();
            }
        },
        [changeExpanded, expandedTreeIds, loadChildren, eventManager]
    );
    // Stop ongoing work and unregister when closing modal
    useEffect(() => {
        return () => {
            expandAbortControllers.current.forEach((controller) => {
                controller.abort();
            });
            eventManager.destroy();
        };
        // eventManager is stable (created once per tree in directoryTreeFactory)
    }, []);

    const initializeFromNode = useCallback(
        async (rootNodeUid: string, myFilesRootUid: string) => {
            try {
                const maybeNode = await drive.getNode(rootNodeUid);
                const { uid, name, type } = getNodeEntity(maybeNode).node;
                const nodeRootTreeItemId = makeTreeItemId(null, uid);
                addItem({
                    nodeUid: uid,
                    treeItemId: nodeRootTreeItemId,
                    parentUid: null,
                    name: uid === myFilesRootUid ? c('Title').t`My files` : name,
                    type,
                    expandable: type === NodeType.Folder,
                    isSharedWithMe: false,
                });

                // Expand the first level of the root node.
                // Note that we can't use the toggleExpand without creating infinite
                // rendering loops.
                const controller = new AbortController();
                expandAbortControllers.current.set(nodeRootTreeItemId, controller);
                changeExpanded(nodeRootTreeItemId, true);
                void loadChildren(uid, controller.signal);
            } catch (error) {
                handleSdkError(error);
                throw error;
            }
        },
        [drive, addItem, loadChildren, changeExpanded]
    );

    const initializeAllRoots = useCallback(
        (myFilesRootUid: string) => {
            const myFilesRootTreeItemId = makeTreeItemId(null, myFilesRootUid);
            addItem({
                nodeUid: myFilesRootUid,
                treeItemId: myFilesRootTreeItemId,
                parentUid: null,
                name: c('Title').t`My files`,
                type: DirectoryTreeRootType.FilesRoot,
                expandable: true,
                isSharedWithMe: false,
                highestEffectiveRole: MemberRole.Admin,
            });

            // Devices
            addItem({
                nodeUid: DEVICES_ROOT_ID,
                treeItemId: makeTreeItemId(null, DEVICES_ROOT_ID),
                parentUid: null,
                name: c('Title').t`Computers`,
                type: DirectoryTreeRootType.DevicesRoot,
                expandable: true,
                isSharedWithMe: false,
            });

            // Shared with me
            if (!options?.hideSharedWithMe) {
                addItem({
                    nodeUid: SHARED_WITH_ME_ROOT_ID,
                    treeItemId: makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID),
                    parentUid: null,
                    name: c('Title').t`Shared with me`,
                    type: DirectoryTreeRootType.SharesRoot,
                    expandable: true,
                    isSharedWithMe: false,
                });
            }
        },
        [addItem]
    );

    // It has to be called before any other call - loads all the top-level elements
    const initializeTree = useCallback(async () => {
        const strategy = options?.treeRootsStrategy ?? { type: 'ALL_ROOTS' };
        const myFilesRoot = await drive.getMyFilesRootFolder();
        const { uid: myFilesRootUid } = getNodeEntity(myFilesRoot).node;

        if (strategy.type === 'FROM_NODE') {
            await initializeFromNode(strategy.rootNodeUid, myFilesRootUid);
            return;
        }

        initializeAllRoots(myFilesRootUid);
    }, [options?.treeRootsStrategy, drive, initializeFromNode, initializeAllRoots]);

    const get = useCallback((uid: string) => items.get(uid), [items]);

    return {
        initializeTree,
        get,
        toggleExpand,
        treeRoots: toTree([...items.values()], expandedTreeIds),
        addNode,
        clear: () => useDirectoryTreeStore.getState().clearStore(),
        loadSharedWithMe,
        expandedTreeIds,
    };
}

export function directoryTreeFactory() {
    const directoryTreeStore = directoryTreeStoreFactory();
    let eventManager: TreeEventManager | undefined;
    function useDirectoryTreeWithStore(context: string, options?: DirectoryTreeOptions) {
        if (!eventManager) {
            eventManager = new TreeEventManager(directoryTreeStore, context);
        }
        return useDirectoryTree(directoryTreeStore, eventManager, options);
    }
    useDirectoryTreeWithStore.getStore = () => directoryTreeStore;
    return useDirectoryTreeWithStore;
}
