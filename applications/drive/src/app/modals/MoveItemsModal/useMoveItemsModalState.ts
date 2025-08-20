import { useState } from 'react';

import { type ModalStateProps, useModalTwoStatic } from '@proton/components';
import { generateNodeUid, splitNodeUid, useDrive } from '@proton/drive';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { type DecryptedLink, useDriveEventManager, useTreeForModals } from '../../store';
import type { NodeEventMeta } from '../../utils/ActionEventManager/ActionEventManagerTypes';
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

export type MoveItemsModalInnerProps = {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
    onSuccess?: (items: { uid: string; parentUid: string | undefined }[]) => void;
};

export type UseMoveItemsModalStateProps = ModalStateProps & MoveItemsModalInnerProps;

export const useMoveItemsModalState = ({
    onClose,
    onSuccess,
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
        const eventItems: NodeEventMeta[] = [];
        for (const itemId of uids) {
            const toFolderUid = parentMap.get(itemId);
            if (!toFolderUid) {
                continue;
            }

            try {
                for await (const result of drive.moveNodes([itemId], toFolderUid)) {
                    const { uid, ok } = result;
                    if (ok) {
                        successIds.push({ uid: result.uid, name: itemMap[uid].name });
                        const { volumeId } = splitNodeUid(toFolderUid);
                        volumeIdSet.add(volumeId);
                        eventItems.push({ uid, parentUid: toFolderUid });
                    } else {
                        failedIds.push({ uid: result.uid, error: result.error });
                    }
                }
            } catch (e) {
                handleError(e, { extra: { itemsUId: uids, toFolderUid } });
            }
        }
        onSuccess?.(eventItems);
        createMovedItemsNotifications(successIds, failedIds);

        volumeIdSet.forEach(async (volumeId) => {
            await events.pollEvents.volumes(volumeId); // TODO:EVENTS remove once views are all ported to sdk
        });
    };

    const moveItemsToFolder = async () => {
        const successIds = [];
        const failedIds = [];
        const parentMap = new Map();
        const eventItems = [];
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
                    eventItems.push({ uid, parentUid: targetFolderUid });
                } else {
                    failedIds.push({ uid: result.uid, error: result.error });
                }
            }
            const undoFunc = () => undoMove(itemMap, parentMap);
            createMovedItemsNotifications(successIds, failedIds, undoFunc);
            onSuccess?.(eventItems);
            const { volumeId } = splitNodeUid(targetFolderUid);
            await events.pollEvents.volumes(volumeId); // TODO:EVENTS
        } catch (e) {
            handleError(e, { extra: { itemsUId: uids, targetFolderUid } });
        }
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
            const targetLinkId = activeFolder.linkId || rootItems[0]?.link.linkId || selectedItems[0]?.parentLinkId;
            const targetVolumeId = activeFolder.volumeId || rootItems[0]?.link.volumeId || selectedItems[0]?.volumeId;
            targetUid = generateNodeUid(targetVolumeId, targetLinkId) as string;
        } else {
            targetUid = targetFolderUid;
        }

        showCreateFolderModal({
            parentFolderUid: targetUid,
            onSuccess: async (newFolderId: string) => {
                // After creating the folder we want to expand its parent so it shows in the tree
                const { nodeId } = splitNodeUid(targetUid);
                expand(nodeId);

                setTargetFolderUid(newFolderId);
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
