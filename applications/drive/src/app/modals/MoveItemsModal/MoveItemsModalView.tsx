import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ModalProps } from '@proton/components';
import {
    Alert,
    ButtonWithTextAndIcon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';
import { NodeType, splitNodeUid, useDrive } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';

import FolderTree from '../../components/FolderTree/FolderTree';
import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { selectMessageForItemList } from '../../components/sections/helpers';
import type { DecryptedLink, TreeItem } from '../../store';
import { getMovedFiles } from '../../utils/moveTexts';
import { EmptyFileTreePlaceholder } from './EmptyFileTreePlaceholder';
import { useMoveEligibility } from './useMoveEligibility';
import type { NodeTarget } from './useMoveItemsModalState';

export type MoveItemsModalViewProps =
    | ({
          loaded: true;
      } & LoadedMoveItemsModalViewProps)
    | { loaded: false };

export type LoadedMoveItemsModalViewProps = {
    nodes: NodeTarget[];
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

export const MoveItemsModalContent = ({
    nodes,
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
}: LoadedMoveItemsModalViewProps) => {
    const [loading, withLoading] = useLoading();

    const itemsToMove = nodes.map((node) => splitNodeUid(node.uid).nodeId);
    const itemsToMoveCount = itemsToMove.length;
    const messages = getMovedFiles(itemsToMoveCount);

    const selectedItemConfigs = nodes.map((node) => ({
        nodeUid: node.uid,
        parentNodeUid: node.parentUid,
    }));
    const { drive } = useDrive();
    const { isInvalidMove, invalidMoveMessage } = useMoveEligibility(selectedItemConfigs, targetFolderUid, drive);

    const title = selectMessageForItemList(
        nodes.map((node) => node.type === NodeType.File),
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

export const MoveItemsModalView: React.FC<MoveItemsModalViewProps & ModalProps> = (props) => {
    if (!props.loaded) {
        return (
            <ModalTwo as="form" open={true} size="large">
                <ModalTwoContent>
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                </ModalTwoContent>
            </ModalTwo>
        );
    }
    return <MoveItemsModalContent {...props} />;
};
