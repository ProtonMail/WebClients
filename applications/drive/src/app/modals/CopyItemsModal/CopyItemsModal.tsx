import React, { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    ButtonWithTextAndIcon,
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalTwoStatic,
} from '@proton/components';
import { MemberRole, NodeType } from '@proton/drive';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { directoryTreeFactory } from '../../modules/directoryTree';
import { getNodeUidFromTreeItemId } from '../../modules/directoryTree/helpers';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { DirectoryTreeRoot } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { useCreateFolderModal } from '../CreateFolderModal';
import { useCopyItems } from './useCopyItems';

/**
 * Creates isolated directory tree state for this modal.
 * Each modal instance maintains its own tree state independent of other sections.
 */
const useCopyModalDirectoryTree = directoryTreeFactory();

type CopyModalItem = {
    uid: string;
    parentUid?: string;
    name: string;
};

const CopyItemsModal = ({ open, onClose, onExit, itemsToCopy }: { itemsToCopy: CopyModalItem[] } & ModalStateProps) => {
    const { initializeTree, get, toggleExpand, treeRoots, addNode } = useCopyModalDirectoryTree({
        onlyFolders: true,
        loadPermissions: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const copyItems = useCopyItems();
    const { handleError } = useSdkErrorHandler();
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();

    useEffect(() => {
        setIsLoading(true);

        initializeTree()
            .then(() => setIsLoading(false))
            .catch(handleError);
    }, [initializeTree, handleError]);

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

    const copyItemsToTarget = () => {
        if (!copyTargetUid) {
            return;
        }

        setIsCopying(true);
        copyItems(itemsToCopy, copyTargetUid)
            .then(onClose)
            .catch((e) => handleError(e, { extra: { itemsToCopy, target: copyTargetTreeId } }))
            .finally(() => setIsCopying(false));
    };

    const errorMessage = targetIsWritable ? null : c('Info').t`You don’t have permission to copy files to this folder.`;

    return (
        <ModalTwo size="large" open={open} onClose={onClose} onExit={onExit}>
            <ModalTwoHeader title={c('Title').t`Make a copy`} />
            <ModalTwoContent>
                <div className="alert-block mb-4">{c('Info').t`Select a folder to make the copy in`}</div>
                {isLoading ? (
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                ) : (
                    <DirectoryTreeRoot
                        roots={treeRoots}
                        toggleExpand={toggleExpand}
                        selectedTreeId={copyTargetTreeId}
                        onSelect={handleSelect}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex justify-space-between w-full">
                    <ButtonWithTextAndIcon
                        onClick={() =>
                            showCreateFolderModal({
                                parentFolderUid: copyTargetUid,
                                onSuccess: ({ uid, name }) =>
                                    uid && copyTargetUid
                                        ? addNode(uid, copyTargetUid, name)
                                        : console.error('Missing data for new folder in copy modal'),
                            })
                        }
                        disabled={!copyTargetUid}
                        iconName="folder-plus"
                        buttonText={c('Action').t`New folder`}
                    />

                    <Tooltip title={errorMessage}>
                        {/* Disabled elements block pointer events, you need a wrapper for the tooltip to work properly */}
                        <span>
                            <Button
                                loading={isCopying}
                                color="norm"
                                onClick={copyItemsToTarget}
                                disabled={!copyTargetUid || !!errorMessage}
                            >{c('Action').t`Make a copy`}</Button>
                        </span>
                    </Tooltip>
                </div>
            </ModalTwoFooter>
            {createFolderModal}
        </ModalTwo>
    );
};

export const useCopyItemsModal = () => {
    const [copyModal, showModal] = useModalTwoStatic(CopyItemsModal);

    function showCopyItemsModal(itemsToCopy: CopyModalItem[]) {
        if (!itemsToCopy.length) {
            return;
        }
        showModal({ itemsToCopy });
    }

    return { copyModal, showCopyItemsModal };
};
