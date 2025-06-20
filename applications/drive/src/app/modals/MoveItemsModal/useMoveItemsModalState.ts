import { useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import type { NodeEntity } from '@proton/drive';
import { useDrive } from '@proton/drive';

import { type DecryptedLink, useDriveEventManager, useTreeForModals } from '../../store';
import useListNotifications from '../../store/_actions/useListNotifications';
import { useSdkErrorHandler } from '../../utils/errorHandling/sdkErrorHandler';
import { useCreateFolderModal } from '../CreateFolderModal';

export type UseMoveItemsModalStateProps = ModalStateProps & {
    shareId: string;
    selectedItems: DecryptedLink[];
};

export const useMoveItemsModalState = ({
    onClose,
    shareId,
    selectedItems,
    ...modalProps
}: UseMoveItemsModalStateProps) => {
    const {
        rootItems,
        expand,
        toggleExpand,
        isLoaded: isTreeLoaded,
    } = useTreeForModals(shareId, { rootExpanded: true, foldersOnly: true });
    const { drive, internal } = useDrive();
    const events = useDriveEventManager();
    const { createMovedItemsNotifications } = useListNotifications();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const { handleError } = useSdkErrorHandler();
    const [targetFolderUid, setTargetFolderUid] = useState<string>();

    let treeSelectedFolder;
    if (targetFolderUid) {
        treeSelectedFolder = internal.splitNodeUid(targetFolderUid).nodeId;
    }

    const undoMove = async (itemsUId: string[], parentMap: Map<string, string>) => {
        const successIds = [];
        const failedIds = [];
        const volumeIdSet = new Set<string>();

        for (const itemId of itemsUId) {
            const targetId = parentMap.get(itemId);
            if (!targetId) {
                continue;
            }

            try {
                for await (const result of drive.moveNodes([itemId], targetId)) {
                    const { nodeId } = internal.splitNodeUid(result.uid);
                    if (result.ok) {
                        successIds.push(nodeId);
                        const { volumeId } = internal.splitNodeUid(targetId);
                        volumeIdSet.add(volumeId);
                    } else {
                        failedIds.push(nodeId);
                    }
                    createMovedItemsNotifications(selectedItems, successIds, failedIds);
                }
            } catch (e) {
                handleError(e as Error, c('Error').t`Failed to move items`, { itemsUId, targetId });
            }
        }
        volumeIdSet.forEach(async (volumeId) => {
            await events.pollEvents.volumes(volumeId);
        });
    };

    const moveItemsToFolder = async () => {
        const successIds = [];
        const failedIds = [];
        const parentMap = new Map();
        if (!targetFolderUid) {
            return;
        }
        const itemsUId = selectedItems.map((item) => {
            const uid = internal.generateNodeUid(item.volumeId, item.linkId);
            parentMap.set(uid, internal.generateNodeUid(item.volumeId, item.parentLinkId));
            return uid;
        });

        try {
            for await (const result of drive.moveNodes(itemsUId, targetFolderUid)) {
                const { nodeId } = internal.splitNodeUid(result.uid);
                if (result.ok) {
                    successIds.push(nodeId);
                } else {
                    failedIds.push(nodeId);
                }
            }

            const undoFunc = () => undoMove(itemsUId, parentMap);
            createMovedItemsNotifications(selectedItems, successIds, failedIds, undoFunc);
            const { volumeId } = internal.splitNodeUid(targetFolderUid);
            await events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e as Error, c('Error').t`Failed to move items`, { itemsUId, targetFolderUid });
        }
    };

    const onTreeSelect = async (link: DecryptedLink) => {
        // TODO: change on FolderTree sdk migration
        const folderNodeId = internal.generateNodeUid(link.volumeId, link.linkId);
        setTargetFolderUid(folderNodeId);
    };

    const handleSubmit = async () => {
        await moveItemsToFolder();
        onClose?.();
    };

    const createFolder = async (selectedItemParentLinkId?: string) => {
        if (rootItems.length > 1 && selectedItemParentLinkId === undefined) {
            return;
        }

        const targetLinkId = selectedItemParentLinkId || rootItems[0]?.link.linkId || selectedItems[0]?.parentLinkId;

        if (!targetLinkId) {
            return;
        }

        showCreateFolderModal({
            parentFolderUid: targetLinkId,
            onCreateDone: async (newFolder: NodeEntity) => {
                setTargetFolderUid(newFolder.uid);

                // After creating the folder we want to expand its parent so it shows in the tree
                const { nodeId: parentFooderNodeId } = internal.splitNodeUid(newFolder.parentUid || newFolder.uid);
                expand(parentFooderNodeId);
            },
        });
    };

    return {
        isTreeLoaded,
        rootItems,
        treeSelectedFolder,
        onTreeSelect,
        handleSubmit,
        createFolder,
        toggleExpand,
        createFolderModal,
        targetFolderUid,
        selectedItems,
        onClose,
        ...modalProps,
    };
};
