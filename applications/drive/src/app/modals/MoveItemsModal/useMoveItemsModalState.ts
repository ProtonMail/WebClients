import { useEffect, useRef, useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import type { MaybeNode } from '@proton/drive';
import { NodeType, generateNodeUid, getDrive, splitNodeUid } from '@proton/drive';
import shallowEqual from '@proton/utils/shallowEqual';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { type MoveNodesItemMap, useMoveNodes } from '../../hooks/sdk/useMoveNodes';
import { useTreeForModals } from '../../store';
import { sendErrorReport } from '../../utils/errorHandling';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getMissingUid, isMissingNode } from '../../utils/sdk/node';
import { useCreateFolderModal } from '../CreateFolderModal';

export type MoveItemsModalInnerProps = {
    shareId: string;
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

export const useMoveItemsModalState = ({ onClose, shareId, nodeUids, ...modalProps }: UseMoveItemsModalStateProps) => {
    const {
        rootItems,
        expand,
        toggleExpand,
        isLoaded: isTreeLoaded,
    } = useTreeForModals(shareId, { rootExpanded: true, foldersOnly: true });

    const drive = getDrive();
    const { onExit } = modalProps;
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const [targetFolderUid, setTargetFolderUid] = useState<string>();
    const { activeFolder } = useActiveShare();
    const { handleError } = useSdkErrorHandler();
    const { moveNodes } = useMoveNodes();
    const [nodes, setNodes] = useState<NodeTarget[] | null>(null);

    // Generate stable uid array even if external items are unstable.
    const uids = useShallowStableArray(nodeUids);

    useEffect(() => {
        const fetchNodes = async () => {
            try {
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
                handleError(e, { showNotification: true });
                onExit();
            }
        };

        void fetchNodes();
    }, [uids, drive, handleError, onExit]);

    if (!nodes) {
        return {
            loaded: false as const,
        };
    }

    const itemMap: MoveNodesItemMap = nodes.reduce((acc, item) => {
        const uid = item.uid;
        const parentUid = item.parentUid;
        return { ...acc, [uid]: { name: item.name, parentUid } };
    }, {});

    let treeSelectedFolder;
    if (targetFolderUid) {
        treeSelectedFolder = splitNodeUid(targetFolderUid).nodeId;
    }

    const moveItemsToFolder = async () => {
        if (!targetFolderUid) {
            return;
        }

        await moveNodes(itemMap, targetFolderUid);
    };

    const onTreeSelect = async (link: { volumeId: string; linkId: string }) => {
        // TODO:FOLDERTREE change on FolderTree sdk migration
        const folderNodeUid = generateNodeUid(link.volumeId, link.linkId);
        setTargetFolderUid(folderNodeUid);
    };

    const handleSubmit = async () => {
        await moveItemsToFolder();
        onClose?.();
    };

    const createNewFolder = async () => {
        if (rootItems.length > 1 && targetFolderUid === undefined) {
            return;
        }

        let targetUid;
        if (!targetFolderUid) {
            const firstNode = nodes[0];
            const firstNodeParentLinkId =
                firstNode && firstNode.parentUid ? splitNodeUid(firstNode.parentUid).nodeId : undefined;
            const firstNodeVolumeId = firstNode ? splitNodeUid(firstNode.uid).volumeId : undefined;
            const targetLinkId = activeFolder.linkId || rootItems[0]?.link.linkId || firstNodeParentLinkId;
            const targetVolumeId = activeFolder.volumeId || rootItems[0]?.link.volumeId || firstNodeVolumeId;
            if (!targetLinkId || !targetVolumeId) {
                return;
            }
            targetUid = generateNodeUid(targetVolumeId, targetLinkId) as string;
        } else {
            targetUid = targetFolderUid;
        }

        void showCreateFolderModal({
            parentFolderUid: targetUid,
            onSuccess: async ({ uid }) => {
                // After creating the folder we want to expand its parent so it shows in the tree
                const { nodeId } = splitNodeUid(targetUid);
                expand(nodeId);

                setTargetFolderUid(uid);
            },
        });
    };

    return {
        loaded: true as const,
        isTreeLoaded,
        rootItems,
        treeSelectedFolder,
        onTreeSelect,
        handleSubmit,
        toggleExpand,
        createFolderModal,
        targetFolderUid,
        nodes,
        onClose,
        createFolder: createNewFolder,
        ...modalProps,
    };
};
