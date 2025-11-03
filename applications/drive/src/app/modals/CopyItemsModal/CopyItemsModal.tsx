import React, { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import {
    type ModalStateProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalTwoStatic,
} from '@proton/components';
import { NodeType } from '@proton/drive';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { directoryTreeFactory } from '../../modules/directoryTree';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { DirectoryTree } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import type { CopyModalItem } from './useCopyItems';
import { useCopyItems } from './useCopyItems';

/**
 * Creates isolated directory tree state for this modal.
 * Each modal instance maintains its own tree state independent of other sections.
 */
const useCopyModalDirectoryTree = directoryTreeFactory();

const CopyItemsModal = ({ open, onClose, onExit, itemsToCopy }: { itemsToCopy: CopyModalItem[] } & ModalStateProps) => {
    const { rootItems, initializeTree, toggleExpand, getChildrenOf } = useCopyModalDirectoryTree({ onlyFolders: true });
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

    const [selectedItemUid, setSelectedItemUid] = useState<string>('');
    const hasSelectedItself = !!itemsToCopy.find((sourceItem) => selectedItemUid === sourceItem.uid);
    const handleSelect = useCallback((targetItem: DirectoryTreeItem) => {
        if (targetItem.type === NodeType.Folder) {
            setSelectedItemUid(targetItem.uid);
        }
    }, []);

    const copyItemsToTarget = () => {
        setIsCopying(true);
        copyItems(itemsToCopy, selectedItemUid)
            .then(onClose)
            .catch((e) => handleError(e, { extra: { itemsToCopy, target: selectedItemUid } }))
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
                    <DirectoryTree
                        items={rootItems}
                        toggleExpand={toggleExpand}
                        getChildrenOf={getChildrenOf}
                        onSelect={handleSelect}
                        selectedItemUid={selectedItemUid}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="flex justify-end gap-4">
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Tooltip title={c('Info').t`It's not possible to copy the folder to itself`}>
                    {/* Disabled elements block pointer events, you need a wrapper for the tooltip to work properly */}
                    <span>
                        <Button
                            color="norm"
                            onClick={copyItemsToTarget}
                            disabled={selectedItemUid === '' || isCopying || hasSelectedItself}
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
