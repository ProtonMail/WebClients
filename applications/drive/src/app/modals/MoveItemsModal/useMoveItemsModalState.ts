import { useState } from 'react';

import { type ModalStateProps, useModalTwoStatic } from '@proton/components';
import { generateNodeUid, splitNodeUid, useDrive } from '@proton/drive';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { type DecryptedLink, useDriveEventManager, useTreeForModals } from '../../store';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { CreateFolderModal } from '../CreateFolderModal';
import { useMovedItemsNotification } from './useMovedItemsNotification';

export type MoveItemsModalStateItem = {
    volumeId: string;
    linkId: string;
    parentLinkId: string;
    rootShareId: string;
    isFile: boolean;
};

export type UseMoveItemsModalStateProps = ModalStateProps & {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
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
    const { createMovedItemsNotifications } = useMovedItemsNotification();
    const [createFolderModal, showCreateFolderModal] = useModalTwoStatic(CreateFolderModal);
    const { handleError } = useSdkErrorHandler();
    const [targetFolderUid, setTargetFolderUid] = useState<string>();
    const { activeFolder } = useActiveShare();

    let treeSelectedFolder;
    if (targetFolderUid) {
        treeSelectedFolder = splitNodeUid(targetFolderUid).nodeId;
    }

    const undoMove = async (itemMap: Record<string, { name: string }>, parentMap: Map<string, string>) => {
        const successIds = [];
        const failedIds = [];
        const volumeIdSet = new Set<string>();
        const uids = Object.keys(itemMap);

        for (const itemId of uids) {
            const targetId = parentMap.get(itemId);
            if (!targetId) {
                continue;
            }

            try {
                for await (const result of drive.moveNodes([itemId], targetId)) {
                    const { uid, ok } = result;
                    if (ok) {
                        successIds.push({ uid: result.uid, name: itemMap[uid].name });
                        const { volumeId } = splitNodeUid(targetId);
                        volumeIdSet.add(volumeId);
                    } else {
                        failedIds.push({ uid: result.uid, error: result.error });
                    }
                }
            } catch (e) {
                handleError(e, { extra: { itemsUId: uids, targetId } });
            }
        }
        createMovedItemsNotifications(successIds, failedIds);
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
        const itemMap: Record<string, DecryptedLink> = selectedItems.reduce((acc, item) => {
            const uid = generateNodeUid(item.volumeId, item.linkId);
            parentMap.set(uid, generateNodeUid(item.volumeId, item.parentLinkId));
            return { ...acc, [uid]: item };
        }, {});
        const uids = Object.keys(itemMap);

        try {
            for await (const result of drive.moveNodes(uids, targetFolderUid)) {
                const { uid, ok } = result;
                if (ok) {
                    successIds.push({ uid: result.uid, name: itemMap[uid].name });
                } else {
                    failedIds.push({ uid: result.uid, error: result.error });
                }
            }

            const undoFunc = () => undoMove(itemMap, parentMap);
            createMovedItemsNotifications(successIds, failedIds, undoFunc);
            const { volumeId } = splitNodeUid(targetFolderUid);
            await events.pollEvents.volumes(volumeId);
        } catch (e) {
            handleError(e, { extra: { itemsUId: uids, targetFolderUid } });
        }
    };

    const onTreeSelect = async (link: DecryptedLink) => {
        // TODO:FOLDERTREE change on FolderTree sdk migration
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

        const targetVolumeId = selectedItemParentLinkId
            ? activeFolder.volumeId
            : rootItems[0]?.link.volumeId || selectedItems[0]?.volumeId;
        const parentFolderUid = generateNodeUid(targetVolumeId, targetLinkId);

        showCreateFolderModal({
            parentFolderUid,
            onCreateDone: async (newFolderUid: string) => {
                setTargetFolderUid(newFolderUid);

                // After creating the folder we want to expand its parent so it shows in the tree
                const { nodeId } = splitNodeUid(parentFolderUid);
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
