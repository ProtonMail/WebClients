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
    useActiveBreakpoint,
} from '@proton/components';
import { useLoading } from '@proton/hooks';

import FolderTree from '../../components/FolderTree/FolderTree';
import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { selectMessageForItemList } from '../../components/sections/helpers';
import type { TreeItem } from '../../store';
import { type DecryptedLink } from '../../store';
import { getMovedFiles } from '../../utils/moveTexts';
import { EmptyFileTreePlaceholder } from './EmptyFileTreePlaceholder';
import type { MoveItemsModalStateItem } from './useMoveItemsModalState';

export type MoveItemsModalViewProps = {
    selectedItems: MoveItemsModalStateItem[];
    handleSubmit: () => Promise<void>;
    rootItems: TreeItem[];
    createFolder: () => void;
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
                        {rootItems.length === 0 && (
                            <>
                                <ModalTwoHeader closeButtonProps={{ disabled: loading }} />
                                <EmptyFileTreePlaceholder onCreate={createFolder} />
                            </>
                        )}
                        {rootItems.length > 0 && (
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
                                                onClick={createFolder}
                                                title={c('Action').t`Create new folder`}
                                            >
                                                <Icon name="folder-plus" />
                                            </Button>
                                        ) : (
                                            <Button
                                                shape="underline"
                                                color="norm"
                                                disabled={loading || !targetFolderUid}
                                                onClick={createFolder}
                                            >
                                                {c('Action').t`Create new folder`}
                                            </Button>
                                        )}
                                        <div>
                                            <Button type="reset" disabled={loading} autoFocus>
                                                {c('Action').t`Close`}
                                            </Button>
                                            <Button
                                                color="norm"
                                                className="ml-4"
                                                loading={loading}
                                                type="submit"
                                                disabled={isMoveDisabled}
                                            >
                                                {c('Action').t`Move`}
                                            </Button>
                                        </div>
                                    </div>
                                </ModalTwoFooter>
                            </>
                        )}
                    </>
                ) : (
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                )}
            </ModalTwo>
            {createFolderModal}
        </>
    );
};
