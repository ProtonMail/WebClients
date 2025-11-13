import React, { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
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
    const { initializeTree, get, toggleExpand, treeRoots } = useCopyModalDirectoryTree({
        onlyFolders: true,
        loadPermissions: true,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);
    const copyItems = useCopyItems();
    const { handleError } = useSdkErrorHandler();

    useEffect(() => {
        setIsLoading(true);

        initializeTree()
            .then(() => setIsLoading(false))
            .catch(handleError);
    }, [initializeTree, handleError]);

    const [copyTargetTreeId, setCopyTargetTreeId] = useState<string>();
    const copyTargetUid = copyTargetTreeId ? getNodeUidFromTreeItemId(copyTargetTreeId) : undefined;
    const isCopyAllowed = checkIsCopyAllowed(itemsToCopy, copyTargetUid);
    const targetIsWritable = copyTargetUid
        ? [MemberRole.Admin, MemberRole.Editor].includes(get(copyTargetUid)?.highestEffectiveRole ?? MemberRole.Viewer)
        : false;

    const handleSelect = useCallback((treeItemId: string, targetItem: DirectoryTreeItem) => {
        if (targetItem.type === NodeType.Folder) {
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

    return (
        <ModalTwo size="large" open={open} onClose={onClose} onExit={onExit}>
            <ModalTwoHeader title={c('Title').t`Make a copy`} />
            <ModalTwoContent>
                <div className="alert-block mb-4">{c('Info').t`Select a folder to copy to.`}</div>
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
            <ModalTwoFooter className="flex justify-end gap-4">
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Tooltip
                    title={
                        <>
                            {isCopyAllowed &&
                                c('Info')
                                    .t`One of the files or folders you want to copy already exist in selected folder.`}
                            {!targetIsWritable && c('Info').t`You don’t have permission to copy files to this folder.`}
                        </>
                    }
                >
                    {/* Disabled elements block pointer events, you need a wrapper for the tooltip to work properly */}
                    <span>
                        <Button
                            color="norm"
                            onClick={copyItemsToTarget}
                            disabled={isCopying || !copyTargetUid || isCopyAllowed || !targetIsWritable}
                        >{c('Action').t`Copy`}</Button>
                    </span>
                </Tooltip>
            </ModalTwoFooter>
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

function checkIsCopyAllowed(itemsToCopy: CopyModalItem[], copyTargetUid: string | undefined) {
    return !!itemsToCopy.find(
        (sourceItem) => copyTargetUid === sourceItem.uid || copyTargetUid === sourceItem.parentUid
    );
}
