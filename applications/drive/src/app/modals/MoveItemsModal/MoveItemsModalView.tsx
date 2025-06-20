import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useActiveBreakpoint,
} from '@proton/components';
import { useLoading } from '@proton/hooks';

import FolderTree from '../../components/FolderTree/FolderTree';
import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { selectMessageForItemList } from '../../components/sections/helpers';
import type { TreeItem } from '../../store';
import { type DecryptedLink } from '../../store';
import { getMovedFiles } from '../../utils/moveTexts';
import EmptyFileTreePlaceholder from './EmptyFileTreePlaceholder';

export type MoveItemsModalViewProps = {
    selectedItems: DecryptedLink[];
    handleSubmit: () => Promise<void>;
    rootItems: TreeItem[];
    createFolder: (parentFolderLinkId?: string) => void;
    onTreeSelect: (link: DecryptedLink) => void;
    toggleExpand: (linkId: string) => void;
    createFolderModal: React.ReactNode;
    isTreeLoaded?: boolean;
    treeSelectedFolder?: string;
    targetFolderUid?: string;
    onClose?: () => void;
};

export const MoveItemsModalView = ({
    selectedItems,
    handleSubmit,
    rootItems,
    createFolder,
    onTreeSelect,
    toggleExpand,
    createFolderModal,
    isTreeLoaded,
    treeSelectedFolder,
    targetFolderUid,
    onClose,
    ...modalProps
}: MoveItemsModalViewProps) => {
    const [loading, withLoading] = useLoading();
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    if (isTreeLoaded && rootItems.length === 0) {
        return (
            <>
                <ModalTwoHeader closeButtonProps={{ disabled: loading }} />
                <EmptyFileTreePlaceholder onCreate={() => createFolder(targetFolderUid)} />
            </>
        );
    }

    const itemsToMove = selectedItems.map((item) => item.linkId);
    const itemsToMoveCount = itemsToMove.length;
    const messages = getMovedFiles(itemsToMoveCount);

    const isMoveDisabled =
        !targetFolderUid ||
        selectedItems.some((item) =>
            [
                item.linkId, // Moving folder to its own folder is not possible.
                item.parentLinkId, // Moving item to the same location is no-op.
            ].includes(targetFolderUid)
        );

    const title = selectMessageForItemList(
        selectedItems.map((item) => item.isFile),
        messages
    );

    return (
        <>
            <ModalTwo
                onClose={onClose}
                size="large"
                as="form"
                onSubmit={(e: React.FormEvent) => {
                    e.preventDefault();
                    withLoading(handleSubmit()).catch(console.error);
                }}
                onReset={() => {
                    onClose?.();
                }}
                {...modalProps}
            >
                {isTreeLoaded ? (
                    <>
                        <ModalTwoHeader title={title} closeButtonProps={{ disabled: loading }} />
                        <ModalTwoContent>
                            <Alert className="mb-4">{c('Info').t`Select a folder to move to.`}</Alert>
                            {/* TODO: migrate FolderTree to SDK */}
                            <FolderTree
                                treeItems={rootItems}
                                isLoaded={true}
                                selectedItemId={treeSelectedFolder}
                                onSelect={onTreeSelect}
                                toggleExpand={toggleExpand}
                            />
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <div className="flex justify-space-between w-full flex-nowrap">
                                {isSmallViewport ? (
                                    <Button
                                        icon
                                        disabled={loading || !targetFolderUid}
                                        onClick={() => createFolder(targetFolderUid)}
                                        title={c('Action').t`Create new folder`}
                                    >
                                        <Icon name="folder-plus" />
                                    </Button>
                                ) : (
                                    <Button
                                        shape="underline"
                                        color="norm"
                                        disabled={loading || !targetFolderUid}
                                        onClick={() => createFolder(targetFolderUid)}
                                    >
                                        {c('Action').t`Create new folder`}
                                    </Button>
                                )}
                                <div>
                                    <Button type="reset" disabled={loading} autoFocus>
                                        {c('Action').t`Close`}
                                    </Button>
                                    <PrimaryButton
                                        className="ml-4"
                                        loading={loading}
                                        type="submit"
                                        disabled={isMoveDisabled}
                                    >
                                        {c('Action').t`Move`}
                                    </PrimaryButton>
                                </div>
                            </div>
                        </ModalTwoFooter>
                    </>
                ) : (
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                )}
            </ModalTwo>
            {createFolderModal}
        </>
    );
};
