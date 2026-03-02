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
import { NodeType, getDrive } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';

import ModalContentLoader from '../../components/modals/ModalContentLoader';
import { selectMessageForItemList } from '../../components/sections/helpers';
import type { DirectoryTreeItem } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { DirectoryTreeRoot } from '../../statelessComponents/DirectoryTree/DirectoryTree';
import { getMovedFiles } from '../../utils/moveTexts';
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
    createFolder: () => void;
    createFolderModal: React.ReactNode;
    onClose: () => void;
    treeRoots: React.ComponentProps<typeof DirectoryTreeRoot>['roots'];
    toggleExpand: React.ComponentProps<typeof DirectoryTreeRoot>['toggleExpand'];
    moveTargetUid: string | undefined;
    moveTargetTreeId: string | undefined;
    handleSelect: (treeItemId: string, targetItem: DirectoryTreeItem) => void;
};

export const MoveItemsModalContent = ({
    nodes,
    handleSubmit,
    createFolder,
    createFolderModal,
    onClose,
    treeRoots,
    toggleExpand,
    moveTargetUid,
    moveTargetTreeId,
    handleSelect,
    ...modalProps
}: LoadedMoveItemsModalViewProps & ModalProps) => {
    const [loading, withLoading] = useLoading();
    const messages = getMovedFiles(nodes.length);
    const selectedItemConfigs = nodes.map((node) => ({
        nodeUid: node.uid,
        parentNodeUid: node.parentUid,
    }));
    const drive = getDrive();
    const { isInvalidMove, invalidMoveMessage } = useMoveEligibility(selectedItemConfigs, moveTargetUid, drive);

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
                    onClose();
                }}
                {...modalProps}
            >
                <ModalTwoHeader title={title} closeButtonProps={{ disabled: loading }} />
                <ModalTwoContent>
                    <Alert className="mb-4">{c('Info').t`Select a folder to move to.`}</Alert>
                    <DirectoryTreeRoot
                        roots={treeRoots}
                        toggleExpand={toggleExpand}
                        selectedTreeId={moveTargetTreeId}
                        onSelect={handleSelect}
                    />
                </ModalTwoContent>
                <ModalTwoFooter>
                    <div className="flex justify-space-between w-full flex-nowrap">
                        <ButtonWithTextAndIcon
                            onClick={createFolder}
                            disabled={loading || !moveTargetUid}
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
            </ModalTwo>
            {createFolderModal}
        </>
    );
};

export const MoveItemsModalView: React.FC<MoveItemsModalViewProps & ModalProps> = ({ loaded, ...rest }) => {
    if (!loaded) {
        return (
            <ModalTwo as="form" open={true} size="large">
                <ModalTwoContent>
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                </ModalTwoContent>
            </ModalTwo>
        );
    }
    return <MoveItemsModalContent {...(rest as LoadedMoveItemsModalViewProps & ModalProps)} />;
};
