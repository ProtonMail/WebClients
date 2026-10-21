import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { ButtonWithTextAndIcon } from '@proton/components/components/button/ButtonWithTextAndIcon';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

import type { DirectoryTreeItem } from '../../../components/DirectoryTree/DirectoryTree';
import { DirectoryTreeRoot } from '../../../components/DirectoryTree/DirectoryTree';
import ModalContentLoader from '../../modalUtils/ModalContentLoader';

export type CopyItemsModalViewProps = ModalStateProps & {
    isLoading: boolean;
    isCopying: boolean;
    treeRoots: React.ComponentProps<typeof DirectoryTreeRoot>['roots'];
    toggleExpand: React.ComponentProps<typeof DirectoryTreeRoot>['toggleExpand'];
    copyTargetTreeId: string | undefined;
    handleSelect: (treeItemId: string, targetItem: DirectoryTreeItem) => void;
    copyTargetUid: string | undefined;
    errorMessage: string | null;
    onCopy: () => void;
    onCreateFolder: () => void;
    createFolderModal: React.ReactNode;
};

export const CopyItemsModalView = ({
    open,
    onClose,
    onExit,
    isLoading,
    isCopying,
    treeRoots,
    toggleExpand,
    copyTargetTreeId,
    handleSelect,
    copyTargetUid,
    errorMessage,
    onCopy,
    onCreateFolder,
    createFolderModal,
}: CopyItemsModalViewProps) => {
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
                        onClick={onCreateFolder}
                        disabled={!copyTargetUid}
                        icon={<IcFolderPlus />}
                        buttonText={c('Action').t`New folder`}
                    />
                    <Tooltip title={errorMessage}>
                        {/* Disabled elements block pointer events, you need a wrapper for the tooltip to work properly */}
                        <span>
                            <Button
                                loading={isCopying}
                                color="norm"
                                onClick={onCopy}
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
