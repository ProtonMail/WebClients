import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { MemberRole, NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getDeviceName } from '../../utils/sdk/getNodeName';
import { directoryTreeStoreFactory } from './directoryTreeStoreFactory';
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
}

/**
 * Each time the node is expanded we iterate over its again - there is no caching.
 * You might want to modify that behaviour when using this hook outside copy modal.
 */
function useDirectoryTree(useDirectoryTreeStore: DirectoryTreeStore, options?: DirectoryTreeOptions) {
    const { drive } = useDrive();

    const { items, addItem, expandedTreeIds, changeExpanded } = useDirectoryTreeStore(
        useShallow((state) => ({
            items: state.items,
            addItem: state.addItem,
            expandedTreeIds: state.expandedTreeIds,
            changeExpanded: state.setExpanded,
        }))
    );

    const addNode = useCallback(
        async (nodeUid: string, parentFolderUid: string, name: string) => {
            const maybeNode = await drive.getNode(nodeUid);

            const { type } = getNodeEntity(maybeNode).node;

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
            });
        },
        [addItem, drive, options?.loadPermissions]
    );

    // It has to be called before any other call - loads all the top-level elements
    const initializeTree = useCallback(async () => {
        // My files
        const myFilesRoot = await drive.getMyFilesRootFolder();
        const { uid } = getNodeEntity(myFilesRoot).node;
        addItem({
            nodeUid: uid,
            treeItemId: makeTreeItemId(null, uid),
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
        addItem({
            nodeUid: SHARED_WITH_ME_ROOT_ID,
            treeItemId: makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID),
            parentUid: null,
            name: c('Title').t`Shared with me`,
            type: DirectoryTreeRootType.SharesRoot,
            expandable: true,
            isSharedWithMe: false,
        });
    }, [drive, addItem]);

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
            try {
                for await (const sharedNode of drive.iterateSharedNodesWithMe(abortSignal)) {
                    const { uid, name, type } = getNodeEntity(sharedNode).node;

                    if (options?.onlyFolders && type !== NodeType.Folder) {
                        continue;
                    }

                    const highestEffectiveRole = options?.loadPermissions
                        ? await findEffectiveRole(drive, sharedNode.ok ? sharedNode.value : sharedNode.error)
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
                    });
                }
            } catch (error) {
                handleSdkError(error, { fallbackMessage: 'Failed to load shared items' });
                throw error;
            }
        },
        [drive, options?.onlyFolders, options?.loadPermissions, addItem]
    );

    const loadChildren = useCallback(
        async (parentUid: string, abortSignal: AbortSignal) => {
            const maybeItem = items.get(parentUid);
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
                return;
            }

            if (parentUid === SHARED_WITH_ME_ROOT_ID) {
                await loadSharedWithMe(abortSignal);
                return;
            }

            try {
                const iterateOptions = options?.onlyFolders ? { type: NodeType.Folder } : undefined;
                for await (const node of drive.iterateFolderChildren(parentUid, iterateOptions, abortSignal)) {
                    const { uid, name, type } = getNodeEntity(node).node;
                    const highestEffectiveRole = options?.loadPermissions
                        ? await findEffectiveRole(drive, node.ok ? node.value : node.error)
                        : undefined;
                    const existingItem = items.get(uid);
                    addItem({
                        nodeUid: uid,
                        parentUid,
                        treeItemId: makeTreeItemId(parentUid, uid),
                        name,
                        type,
                        expandable: type === NodeType.Folder,
                        // We need to preserve value between item displayed in the root of shares and deeply nested child that is also shared.
                        isSharedWithMe: existingItem?.isSharedWithMe ?? false,
                        highestEffectiveRole,
                    });
                }
            } catch (error) {
                handleSdkError(error, {
                    fallbackMessage: 'Failed to expand folder',
                    extra: { uid: parentUid },
                });
                throw error;
            }
        },
        [items, loadDevices, loadSharedWithMe, options?.onlyFolders, options?.loadPermissions, drive, addItem]
    );

    const expandAbortControllers = useRef(new Map<string, AbortController>());
    const toggleExpand = useCallback(
        async (treeItemId: string) => {
            const shouldExpand = !expandedTreeIds.get(treeItemId);

            if (shouldExpand) {
                const controller = new AbortController();
                expandAbortControllers.current.set(treeItemId, controller);

                const uid = getNodeUidFromTreeItemId(treeItemId);
                if (!uid) {
                    return;
                }

                await loadChildren(uid, controller.signal);
            } else {
                // Cancel ongoing work when collapsing
                expandAbortControllers.current.get(treeItemId)?.abort();
                expandAbortControllers.current.delete(treeItemId);
            }

            changeExpanded(treeItemId, !!shouldExpand);
        },
        [changeExpanded, expandedTreeIds, loadChildren]
    );
    // Stop ongoing work when closing modal
    useEffect(() => {
        return () => {
            expandAbortControllers.current.forEach((controller) => {
                controller.abort();
            });
        };
    }, []);

    const get = useCallback((uid: string) => items.get(uid), [items]);

    return {
        initializeTree,
        get,
        toggleExpand,
        treeRoots: toTree([...items.values()], expandedTreeIds),
        addNode,
    };
}

export function directoryTreeFactory() {
    const directoryTreeStore = directoryTreeStoreFactory();
    return function useDirectoryTreeWithStore(options?: DirectoryTreeOptions) {
        return useDirectoryTree(directoryTreeStore, options);
    };
}
