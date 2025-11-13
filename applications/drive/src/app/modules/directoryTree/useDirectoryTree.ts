import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import type { DegradedNode } from '@proton/drive';
import { MemberRole, type NodeEntity, NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { getDeviceName } from '../../utils/sdk/getNodeName';
import { directoryTreeStoreFactory } from './directoryTreeStoreFactory';
import {
    DEVICES_ROOT_ID,
    SHARED_WITH_ME_ROOT_ID,
    getMorePermissiveRole,
    getName,
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

    // It has to be called before any other call - loads all the top-level elements
    const initializeTree = useCallback(async () => {
        // My files
        const myFilesRoot = await drive.getMyFilesRootFolder();
        const { uid, type } = myFilesRoot.ok ? myFilesRoot.value : myFilesRoot.error;
        addItem({
            nodeUid: uid,
            treeItemId: makeTreeItemId(null, uid),
            parentUid: null,
            name: c('Title').t`My files`,
            type,
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
            type: DirectoryTreeRootType.PlaceholderRoot,
            expandable: true,
            isSharedWithMe: false,
        });

        // Shared with me
        addItem({
            nodeUid: SHARED_WITH_ME_ROOT_ID,
            treeItemId: makeTreeItemId(null, SHARED_WITH_ME_ROOT_ID),
            parentUid: null,
            name: c('Title').t`Shared with me`,
            type: DirectoryTreeRootType.PlaceholderRoot,
            expandable: true,
            isSharedWithMe: false,
        });
    }, [drive, addItem]);

    const findEffectiveRole = useCallback(
        async (node: NodeEntity | DegradedNode, previousHighestRole?: MemberRole) => {
            if (node.directRole === MemberRole.Admin) {
                return MemberRole.Admin;
            }

            if (previousHighestRole) {
                const newHighest = getMorePermissiveRole(previousHighestRole, node.directRole);

                if (newHighest === MemberRole.Admin) {
                    return MemberRole.Admin;
                }

                // No parent, stop traversing
                if (!node.parentUid) {
                    return newHighest;
                }

                const parent = await drive.getNode(node.parentUid);
                return findEffectiveRole(parent.ok ? parent.value : parent.error, newHighest);
            }

            // No previous highest role = current one is the highest
            if (node.parentUid) {
                const parent = await drive.getNode(node.parentUid);
                return findEffectiveRole(parent.ok ? parent.value : parent.error, node.directRole);
            } else {
                // No parent, stop traversing
                return node.directRole;
            }
        },
        [drive]
    );

    const loadDevices = useCallback(async () => {
        try {
            for await (const device of drive.iterateDevices()) {
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
    }, [addItem, drive]);

    const loadSharedWithMe = useCallback(async () => {
        try {
            for await (const sharedNode of drive.iterateSharedNodesWithMe()) {
                const { uid, type } = sharedNode.ok ? sharedNode.value : sharedNode.error;

                if (options?.onlyFolders && type !== NodeType.Folder) {
                    continue;
                }

                const highestEffectiveRole = options?.loadPermissions
                    ? await findEffectiveRole(sharedNode.ok ? sharedNode.value : sharedNode.error)
                    : undefined;
                addItem({
                    nodeUid: uid,
                    treeItemId: makeTreeItemId(SHARED_WITH_ME_ROOT_ID, uid),
                    parentUid: SHARED_WITH_ME_ROOT_ID,
                    name: getName(sharedNode),
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
    }, [drive, options?.onlyFolders, options?.loadPermissions, findEffectiveRole, addItem]);

    const loadChildren = useCallback(
        async (parentUid: string) => {
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
                await loadDevices();
                return;
            }

            if (parentUid === SHARED_WITH_ME_ROOT_ID) {
                await loadSharedWithMe();
                return;
            }

            try {
                const iterateOptions = options?.onlyFolders ? { type: NodeType.Folder } : undefined;
                for await (const node of drive.iterateFolderChildren(parentUid, iterateOptions)) {
                    const { uid, type } = node.ok ? node.value : node.error;
                    const highestEffectiveRole = options?.loadPermissions
                        ? await findEffectiveRole(node.ok ? node.value : node.error)
                        : undefined;
                    const existingItem = items.get(uid);
                    addItem({
                        nodeUid: uid,
                        parentUid,
                        treeItemId: makeTreeItemId(parentUid, uid),
                        name: getName(node),
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
        [
            items,
            loadDevices,
            loadSharedWithMe,
            options?.onlyFolders,
            options?.loadPermissions,
            drive,
            findEffectiveRole,
            addItem,
        ]
    );

    const toggleExpand = useCallback(
        async (treeItemId: string) => {
            const newValue = !expandedTreeIds.get(treeItemId);

            if (newValue) {
                const uid = getNodeUidFromTreeItemId(treeItemId);
                if (!uid) {
                    return;
                }
                await loadChildren(uid);
            }

            changeExpanded(treeItemId, !!newValue);
        },
        [changeExpanded, expandedTreeIds, loadChildren]
    );

    const get = useCallback((uid: string) => items.get(uid), [items]);

    return {
        initializeTree,
        get,
        toggleExpand,
        treeRoots: toTree([...items.values()], expandedTreeIds),
    };
}

export function directoryTreeFactory() {
    const directoryTreeStore = directoryTreeStoreFactory();
    return function useDirectoryTreeWithStore(options?: DirectoryTreeOptions) {
        return useDirectoryTree(directoryTreeStore, options);
    };
}
