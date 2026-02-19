import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    Alert,
    ButtonWithTextAndIcon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';
import { generateNodeUid, useDrive } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';

import FolderTree from '../../components/FolderTree/FolderTree';
import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { selectMessageForItemList } from '../../components/sections/helpers';
import type { DecryptedLink, TreeItem } from '../../store';
import { getMovedFiles } from '../../utils/moveTexts';
import { EmptyFileTreePlaceholder } from './EmptyFileTreePlaceholder';
import { useMoveEligibility } from './useMoveEligibility';
import type { MoveItemsModalStateItem } from './useMoveItemsModalState';

export type MoveItemsModalViewProps = {
    items: MoveItemsModalStateItem[];
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
    items,
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

    const itemsToMove = items.map((item) => item.linkId);
    const itemsToMoveCount = itemsToMove.length;
    const messages = getMovedFiles(itemsToMoveCount);

    const selectedItemConfigs = items.map((item) => ({
        nodeUid: generateNodeUid(item.volumeId, item.linkId),
        parentNodeUid: generateNodeUid(item.volumeId, item.parentLinkId),
    }));
    const { drive } = useDrive();
    const { isInvalidMove, invalidMoveMessage } = useMoveEligibility(selectedItemConfigs, targetFolderUid, drive);

    const title = selectMessageForItemList(
        items.map((item) => item.isFile),
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
                                        <ButtonWithTextAndIcon
                                            onClick={createFolder}
                                            disabled={loading || !targetFolderUid}
                                            iconName="folder-plus"
                                            buttonText={c('Action').t`New folder`}
                                        />
                                        <div className="flex justify-space-between flex-nowrap">
                                            <Button type="reset" disabled={loading} autoFocus>
                                                {c('Action').t`Close`}
                                            </Button>
                                            <Tooltip title={invalidMoveMessage}>
                                                <span>
                                                    <Button
                                                        color="norm"
                                                        className="ml-4"
                                                        loading={loading}
                                                        type="submit"
                                                        disabled={loading || isInvalidMove}
                                                    >
                                                        {c('Action').t`Move`}
                                                    </Button>
                                                </span>
                                            </Tooltip>
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
