import { useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import { generateNodeUid, splitNodeUid } from '@proton/drive';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { type MoveNodesItemMap, useMoveNodes } from '../../hooks/sdk/useMoveNodes';
import { useTreeForModals } from '../../store';
import { useCreateFolderModal } from '../CreateFolderModal';

export type MoveItemsModalStateItem = {
    volumeId: string;
    linkId: string;
    parentLinkId: string;
    rootShareId: string;
    isFile: boolean;
    name: string;
};

export type MoveItemsModalInnerProps = {
    shareId: string;
    items: MoveItemsModalStateItem[];
};

export type UseMoveItemsModalStateProps = ModalStateProps & MoveItemsModalInnerProps;

export const useMoveItemsModalState = ({ onClose, shareId, items, ...modalProps }: UseMoveItemsModalStateProps) => {
    const {
        rootItems,
        expand,
        toggleExpand,
        isLoaded: isTreeLoaded,
    } = useTreeForModals(shareId, { rootExpanded: true, foldersOnly: true });
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const [targetFolderUid, setTargetFolderUid] = useState<string>();
    const { activeFolder } = useActiveShare();

    const itemMap: MoveNodesItemMap = items.reduce((acc, item) => {
        const uid = generateNodeUid(item.volumeId, item.linkId);
        const parentUid = generateNodeUid(item.volumeId, item.parentLinkId);
        return { ...acc, [uid]: { name: item.name, parentUid } };
    }, {});

    const { moveNodes } = useMoveNodes();

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
            const targetLinkId = activeFolder.linkId || rootItems[0]?.link.linkId || items[0]?.parentLinkId;
            const targetVolumeId = activeFolder.volumeId || rootItems[0]?.link.volumeId || items[0]?.volumeId;
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
        isTreeLoaded,
        rootItems,
        treeSelectedFolder,
        onTreeSelect,
        handleSubmit,
        toggleExpand,
        createFolderModal,
        targetFolderUid,
        items,
        onClose,
        createFolder: createNewFolder,
        ...modalProps,
    };
};
