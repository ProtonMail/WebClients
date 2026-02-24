import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { MemberRole, NodeType } from '@proton/drive';

import { directoryTreeFactory } from '../../modules/directoryTree';
import { getNodeUidFromTreeItemId } from '../../modules/directoryTree/helpers';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useCreateFolderModal } from '../CreateFolderModal';
import { useCopyItems } from './useCopyItems';

/**
 * Creates isolated directory tree state for this modal.
 * Each modal instance maintains its own tree state independent of other sections.
 */
const useCopyModalDirectoryTree = directoryTreeFactory();

export type CopyModalItem = {
    uid: string;
    parentUid?: string;
    name: string;
};

export type CopyItemsModalInnerProps = {
    itemsToCopy: CopyModalItem[];
};

export type UseCopyItemsModalStateProps = ModalStateProps & CopyItemsModalInnerProps;

export const useCopyItemsModalState = ({ itemsToCopy, onClose, ...modalProps }: UseCopyItemsModalStateProps) => {
    const { initializeTree, get, toggleExpand, treeRoots, addNode } = useCopyModalDirectoryTree({
        onlyFolders: true,
        loadPermissions: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const copyItems = useCopyItems();
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();

    useEffect(() => {
        setIsLoading(true);

        initializeTree()
            .then(() => setIsLoading(false))
            .catch(handleSdkError);
    }, [initializeTree]);

    const [copyTargetTreeId, setCopyTargetTreeId] = useState<string>();
    const copyTargetUid = copyTargetTreeId ? getNodeUidFromTreeItemId(copyTargetTreeId) : undefined;
    const targetIsWritable = copyTargetUid
        ? [MemberRole.Admin, MemberRole.Editor].includes(get(copyTargetUid)?.highestEffectiveRole ?? MemberRole.Viewer)
        : undefined;

    const handleSelect = useCallback((treeItemId: string, targetItem: DirectoryTreeItem) => {
        if ([NodeType.Folder, 'files-root'].includes(targetItem.type)) {
            setCopyTargetTreeId(treeItemId);
        }
    }, []);

    const handleCopy = () => {
        if (!copyTargetUid) {
            return;
        }

        setIsCopying(true);
        copyItems(itemsToCopy, copyTargetUid)
            .then(onClose)
            .catch((e) => handleSdkError(e, { extra: { itemsToCopy, target: copyTargetTreeId } }))
            .finally(() => setIsCopying(false));
    };

    const handleCreateFolder = () => {
        showCreateFolderModal({
            parentFolderUid: copyTargetUid,
            onSuccess: ({ uid, name }) =>
                uid && copyTargetUid
                    ? addNode(uid, copyTargetUid, name)
                    : console.error('Missing data for new folder in copy modal'),
        });
    };

    const errorMessage = targetIsWritable ? null : c('Info').t`You don't have permission to copy files to this folder.`;

    return {
        isLoading,
        isCopying,
        treeRoots,
        toggleExpand,
        copyTargetTreeId,
        handleSelect,
        copyTargetUid,
        errorMessage,
        onCopy: handleCopy,
        onCreateFolder: handleCreateFolder,
        createFolderModal,
        onClose,
        ...modalProps,
    };
};
