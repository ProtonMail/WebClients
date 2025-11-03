import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { NodeType, useDrive } from '@proton/drive';

import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { directoryTreeStoreFactory } from './directoryTreeStoreFactory';
import type { DirectoryTreeStore } from './types';
import { DirectoryTreeRootType } from './types';

const DEVICES_ROOT_ID = 'devices-root';
const SHARED_WITH_ME_ROOT_ID = 'shared-with-me-root';

interface DirectoryTreeOptions {
    onlyFolders: boolean;
}

/**
 * Each time the node is expanded we iterate over its again - there is no caching.
 * You might want to modify that behaviour when using this hook outside copy modal.
 */
function useDirectoryTree(useDirectoryTreeStore: DirectoryTreeStore, options?: DirectoryTreeOptions) {
    const { drive } = useDrive();

    const { items, addItem, getChildrenOf, setExpanded } = useDirectoryTreeStore(
        useShallow((state) => ({
            items: state.items,
            addItem: state.addItem,
            getChildrenOf: state.getChildrenOf,
            setExpanded: state.setExpanded,
        }))
    );

    // It has to be called before any other call - loads all the top-level elements
    const initializeTree = useCallback(async () => {
        // My files
        const myFilesRoot = await drive.getMyFilesRootFolder();
        if (myFilesRoot.ok) {
            addItem({
                uid: myFilesRoot.value.uid,
                parentUid: null,
                name: c('Title').t`My files`,
                type: myFilesRoot.value.type,
                expanded: false,
                expandable: true,
            });
        } else {
            const error = new Error(c('Error').t`Cannot load "My files" root folder`);
            handleSdkError(error);
            throw error;
        }

        // Devices
        addItem({
            uid: DEVICES_ROOT_ID,
            parentUid: null,
            name: c('Title').t`Computers`,
            type: DirectoryTreeRootType.PlaceholderRoot,
            expanded: false,
            expandable: true,
        });

        // Shared with me
        addItem({
            uid: SHARED_WITH_ME_ROOT_ID,
            parentUid: null,
            name: c('Title').t`Shared with me`,
            type: DirectoryTreeRootType.PlaceholderRoot,
            expanded: false,
            expandable: true,
        });
    }, [drive, addItem]);

    const loadDevices = useCallback(async () => {
        try {
            for await (const device of drive.iterateDevices()) {
                if (device.name.ok) {
                    addItem({
                        uid: device.rootFolderUid,
                        parentUid: DEVICES_ROOT_ID,
                        name: device.name.value,
                        type: DirectoryTreeRootType.Device,
                        expanded: false,
                        expandable: true,
                    });
                }
            }
        } catch (error) {
            handleSdkError(error, { fallbackMessage: 'Failed to load devices' });
            throw error;
        }
    }, [addItem, drive]);

    const loadSharedWithMeRoots = useCallback(async () => {
        try {
            for await (const sharedNode of drive.iterateSharedNodesWithMe()) {
                if (sharedNode.ok) {
                    const { type } = sharedNode.value;

                    if (options?.onlyFolders && type !== NodeType.Folder) {
                        continue;
                    }

                    addItem({
                        uid: sharedNode.value.uid,
                        parentUid: SHARED_WITH_ME_ROOT_ID,
                        name: sharedNode.value.name,
                        type,
                        expanded: false,
                        expandable: sharedNode.value.type === NodeType.Folder,
                    });
                }
            }
        } catch (error) {
            handleSdkError(error, { fallbackMessage: 'Failed to load shared items' });
            throw error;
        }
    }, [addItem, drive, options?.onlyFolders]);

    const toggleExpand = useCallback(
        async (uid: string) => {
            const maybeItem = items.get(uid);
            if (!maybeItem) {
                const error = new Error(c('Error').t`Expanding non-existent directory tree item`);
                sendErrorReport(error);
                throw error;
            }
            if (maybeItem.expandable === false) {
                const error = new Error(c('Error').t`Expanding non-expandable directory tree item`);
                sendErrorReport(error);
                throw error;
            }
            if (maybeItem.expanded) {
                setExpanded(uid, false);
                return;
            }

            if (uid === DEVICES_ROOT_ID) {
                await loadDevices();
                setExpanded(uid, true);
                return;
            }

            if (uid === SHARED_WITH_ME_ROOT_ID) {
                await loadSharedWithMeRoots();
                setExpanded(uid, true);
                return;
            }

            try {
                const iterateOptions = options?.onlyFolders ? { type: NodeType.Folder } : undefined;
                for await (const node of drive.iterateFolderChildren(uid, iterateOptions)) {
                    if (node.ok) {
                        addItem({
                            uid: node.value.uid,
                            parentUid: uid,
                            name: node.value.name,
                            type: node.value.type,
                            expanded: false,
                            expandable: node.value.type === NodeType.Folder,
                        });
                    }
                }
                setExpanded(uid, true);
            } catch (error) {
                handleSdkError(error, { fallbackMessage: 'Failed to load folder children', extra: { uid } });
                throw error;
            }
        },
        [items, setExpanded, loadDevices, loadSharedWithMeRoots, drive, options?.onlyFolders, addItem]
    );

    return {
        rootItems: [...items.values()].filter((item) => item.parentUid === null),
        initializeTree,
        toggleExpand,
        getChildrenOf,
    };
}

export function directoryTreeFactory() {
    const directoryTreeStore = directoryTreeStoreFactory();
    return function useDirectoryTreeWithStore(options?: DirectoryTreeOptions) {
        return useDirectoryTree(directoryTreeStore, options);
    };
}
