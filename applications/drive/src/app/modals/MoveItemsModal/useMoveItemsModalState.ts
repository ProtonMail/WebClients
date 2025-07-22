import { useState } from 'react';

import { c } from 'ttag';

import { type ModalStateProps, useModalTwoStatic } from '@proton/components';
import { generateNodeUid, splitNodeUid, useDrive } from '@proton/drive';

import { type DecryptedLink, useDriveEventManager, useTreeForModals } from '../../store';
import useListNotifications from '../../store/_actions/useListNotifications';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { CreateFolderModal } from '../CreateFolderModal';

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
    const { drive } = useDrive();
    const events = useDriveEventManager();
    const { createMovedItemsNotifications } = useListNotifications();
    const [createFolderModal, showCreateFolderModal] = useModalTwoStatic(CreateFolderModal);
    const { handleError } = useSdkErrorHandler();
    const [targetFolderUid, setTargetFolderUid] = useState<string>();

    let treeSelectedFolder;
    if (targetFolderUid) {
        treeSelectedFolder = splitNodeUid(targetFolderUid).nodeId;
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
                    const { nodeId } = splitNodeUid(result.uid);
                    if (result.ok) {
                        successIds.push(nodeId);
                        const { volumeId } = splitNodeUid(targetId);
                        volumeIdSet.add(volumeId);
                    } else {
                        failedIds.push(nodeId);
                    }
                }
            } catch (e) {
                handleError(e, { fallbackMessage: c('Error').t`Failed to move items`, extra: { itemsUId, targetId } });
            }
        }

        createMovedItemsNotifications(selectedItems, successIds, failedIds);
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
            const uid = generateNodeUid(item.volumeId, item.linkId);
            parentMap.set(uid, generateNodeUid(item.volumeId, item.parentLinkId));
            return uid;
        });

        try {
            for await (const result of drive.moveNodes(itemsUId, targetFolderUid)) {
                const { nodeId } = splitNodeUid(result.uid);
                if (result.ok) {
                    successIds.push(nodeId);
                } else {
                    failedIds.push(nodeId);
                }
            }

            const undoFunc = () => undoMove(itemsUId, parentMap);
            createMovedItemsNotifications(selectedItems, successIds, failedIds, undoFunc);
            const { volumeId } = splitNodeUid(targetFolderUid);
            await events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, {
                fallbackMessage: c('Error').t`Failed to move items`,
                extra: { itemsUId, targetFolderUid },
            });
        }
    };

    const onTreeSelect = async (link: DecryptedLink) => {
        // TODO: change on FolderTree sdk migration
        const folderNodeUid = generateNodeUid(link.volumeId, link.linkId);
        setTargetFolderUid(folderNodeUid);
    };

    const handleSubmit = async () => {
        await moveItemsToFolder();
        onClose?.();
    };

    const createNewFolder = async (selectedItemParentLinkId?: string) => {
        if (rootItems.length > 1 && selectedItemParentLinkId === undefined) {
            return;
        }

        const targetLinkId = selectedItemParentLinkId || rootItems[0]?.link.linkId || selectedItems[0]?.parentLinkId;

        if (!targetLinkId) {
            return;
        }

        showCreateFolderModal({
            parentFolderUid: targetLinkId,
            onCreateDone: async (newFolderUid: string) => {
                setTargetFolderUid(newFolderUid);

                // After creating the folder we want to expand its parent so it shows in the tree
                const { nodeId } = splitNodeUid(targetLinkId);
                expand(nodeId);
            },
        });
    };

    return {
        isTreeLoaded,
        rootItems,
        treeSelectedFolder,
        onTreeSelect,
        handleSubmit,
        toggleExpand,
        createFolderModal,
        targetFolderUid,
        selectedItems,
        onClose,
        createFolder: createNewFolder,
        ...modalProps,
    };
};
