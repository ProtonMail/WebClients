import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useNotifications } from '@proton/components';
import type { MaybeNode, ProtonDriveClient, Result } from '@proton/drive';
import { NodeType, getDrive } from '@proton/drive';
import shallowEqual from '@proton/utils/shallowEqual';

import { type MoveNodesItemMap, useMoveNodes } from '../../hooks/sdk/useMoveNodes';
import { directoryTreeFactory } from '../../modules/directoryTree';
import { getNodeUidFromTreeItemId, makeTreeItemId } from '../../modules/directoryTree/helpers';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { sendErrorReport } from '../../utils/errorHandling';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getMissingUid, isMissingNode } from '../../utils/sdk/node';
import { useCreateFolderModal } from '../CreateFolderModal';

export type MoveItemsModalInnerProps = {
    nodeUids: string[];
};

export type UseMoveItemsModalStateProps = ModalStateProps & MoveItemsModalInnerProps;

const useShallowStableArray = (nextValue: string[]): string[] => {
    const ref = useRef<string[]>([]);
    if (!shallowEqual(ref.current, nextValue)) {
        ref.current = nextValue;
    }
    return ref.current;
};

export type NodeTarget = {
    uid: string;
    parentUid?: string | undefined;
    name: string;
    type: NodeType;
};

/**
 * Creates isolated directory tree state for this modal.
 * Each modal instance maintains its own tree state independent of other sections.
 */
const useMoveItemsModalDirectoryTree = directoryTreeFactory();

// Resolves the shared top-level root for all provided node UIDs by walking their ancestry.
// All nodes must belong to the same root (same share/volume); returns an error if they don't.
// The resulting UID is used as the scope root for the move modal's directory tree.
const resolveTreeScopeRootUid = async (
    nodeUids: string[],
    drive: ProtonDriveClient
): Promise<Result<string, Error>> => {
    let commonRootUid: string | undefined;

    for (const nodeUid of nodeUids) {
        const ancestryResult = await getNodeAncestry(nodeUid, drive);
        if (!ancestryResult.ok) {
            return ancestryResult;
        }
        const topRoot = ancestryResult.value[0];
        if (!topRoot) {
            return { ok: false, error: new Error(`No ancestry found for node ${nodeUid}`) };
        }
        const { node } = getNodeEntity(topRoot);
        if (commonRootUid === undefined) {
            commonRootUid = node.uid;
        } else if (commonRootUid !== node.uid) {
            return { ok: false, error: new Error('Nodes do not share a common root') };
        }
    }

    if (commonRootUid === undefined) {
        return { ok: false, error: new Error('No nodes provided') };
    }

    return { ok: true, value: commonRootUid };
};

export const useMoveItemsModalState = ({ onClose, nodeUids, ...modalProps }: UseMoveItemsModalStateProps) => {
    const [directoryTreeLoading, setDirectoryTreeLoading] = useState(true);
    const [scopeMoveNodeUid, setScopeMoveNodeUid] = useState<string | null>(null);

    const rootStrategy = useMemo(() => {
        return { type: 'FROM_NODE' as const, rootNodeUid: scopeMoveNodeUid || '' };
    }, [scopeMoveNodeUid]);

    const { initializeTree, toggleExpand, treeRoots, addNode, clear } = useMoveItemsModalDirectoryTree(
        'moveItemsModal',
        {
            onlyFolders: true,
            loadPermissions: true,
            treeRootsStrategy: rootStrategy,
        }
    );

    const customOnClose = useCallback(() => {
        onClose();

        // Make sure the zustand store associated with this modal is cleared each time we close
        // the modal to avoid any accumulation artifacts between several openings of the
        // move modal.
        clear();
    }, [onClose, clear]);

    const { onExit } = modalProps;
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();

    const { moveNodes } = useMoveNodes();
    const [nodes, setNodes] = useState<NodeTarget[] | null>(null);

    const { createNotification } = useNotifications();

    useEffect(() => {
        const controller = new AbortController();
        const fn = async () => {
            const rootNodeResult = await resolveTreeScopeRootUid(nodeUids, getDrive());
            if (controller.signal.aborted) {
                return;
            }
            if (rootNodeResult.ok) {
                setScopeMoveNodeUid(rootNodeResult.value);
            } else {
                sendErrorReport(rootNodeResult.error);
                createNotification({
                    type: 'error',
                    text: c('Error').t`Cannot find move target`,
                });
                customOnClose();
            }
        };
        void fn();
        return () => controller.abort();
    }, [createNotification, customOnClose, nodeUids]);

    useEffect(() => {
        if (!scopeMoveNodeUid) {
            // We need to wait for the scope node uid to be computed before
            // initializing the tree.
            return;
        }
        setDirectoryTreeLoading(true);
        initializeTree()
            .then(() => setDirectoryTreeLoading(false))
            .catch(handleSdkError);
    }, [scopeMoveNodeUid, initializeTree]);

    const [moveTargetTreeId, setMoveTargetTreeId] = useState<string>();
    const moveTargetUid = moveTargetTreeId ? getNodeUidFromTreeItemId(moveTargetTreeId) : undefined;

    // Generate stable uid array even if external items are unstable.
    const uids = useShallowStableArray(nodeUids);

    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const drive = getDrive();
                const fetchedNodes: NodeTarget[] = [];
                for await (const maybeMissingNode of drive.iterateNodes(uids)) {
                    if (isMissingNode(maybeMissingNode)) {
                        const missingUid = getMissingUid(maybeMissingNode);

                        // A missing node (deleted while the modal opens) was selected: we create a synthetic fake node that
                        // will be rejected by the backend and let the user reselect nodes after the error
                        // handling. This should be a very edge case and does not need more refined UX than that.
                        sendErrorReport(
                            new Error(`Missing nodes found while moving items: ${getMissingUid(maybeMissingNode)}`)
                        );
                        fetchedNodes.push({
                            uid: missingUid,
                            parentUid: 'synthetic-missing-parent-uid',
                            name: 'Missing',
                            type: NodeType.File,
                        });
                        continue;
                    }
                    const maybeNode = maybeMissingNode satisfies MaybeNode;
                    const { node } = getNodeEntity(maybeNode);
                    fetchedNodes.push(node);
                }
                setNodes(fetchedNodes);
            } catch (e) {
                handleSdkError(e, { showNotification: true });
                onExit();
            }
        };

        void fetchNodes();
    }, [uids, onExit]);

    const handleSelect = useCallback((treeItemId: string, targetItem: DirectoryTreeItem) => {
        // Make sure we always move files to a real folder (e.g. My files, any subfolder, a device folder) and not a
        // synthetic folder (e.g. "Shared with me" or "Devices"):
        if ([NodeType.Folder, 'files-root'].includes(targetItem.type)) {
            setMoveTargetTreeId(treeItemId);
        }
    }, []);

    if (!nodes || directoryTreeLoading || !scopeMoveNodeUid) {
        return {
            loaded: false as const,
        };
    }

    const itemMap: MoveNodesItemMap = nodes.reduce((acc, item) => {
        const uid = item.uid;
        const parentUid = item.parentUid;
        return { ...acc, [uid]: { name: item.name, parentUid } };
    }, {});

    const moveItemsToFolder = async () => {
        if (!moveTargetUid) {
            return;
        }

        await moveNodes(itemMap, moveTargetUid);
    };

    const handleSubmit = async () => {
        await moveItemsToFolder();
        customOnClose();
    };

    const createNewFolder = async () => {
        // Use current selection as parent, or fall back to scope root.
        const targetUid = moveTargetUid ? moveTargetUid : scopeMoveNodeUid;

        void showCreateFolderModal({
            parentFolderUid: targetUid,
            onSuccess: async ({ uid, parentUid, name }) => {
                if (uid && parentUid) {
                    // Add new folder to the store:
                    await addNode(uid, parentUid, name);

                    if (moveTargetTreeId) {
                        // Expand currently selected to show the newly created node (from the store),
                        await toggleExpand(moveTargetTreeId);
                        // And select it:
                        const targetTreeItemId = makeTreeItemId(parentUid, uid);
                        setMoveTargetTreeId(targetTreeItemId);
                    }
                }
            },
        });
    };

    return {
        loaded: true as const,
        handleSubmit,
        createFolderModal,
        nodes,
        onClose: customOnClose,
        createFolder: createNewFolder,
        treeRoots,
        moveTargetTreeId,
        moveTargetUid,
        handleSelect,
        toggleExpand,

        ...modalProps,
    };
};
