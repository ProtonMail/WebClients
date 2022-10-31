import React, { ReactNode, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    UnderlineButton,
    useActiveBreakpoint,
    useLoading,
    useModals,
} from '@proton/components';

import { DecryptedLink, TreeItem, useActions, useFolderTreeModals } from '../../store';
import CreateFolderModal from '../CreateFolderModal';
import FolderTree from '../FolderTree/FolderTree';
import ModalContentLoader from '../ModalContentLoader';
import { selectMessageForItemList } from '../sections/helpers';
import HasNoFolders from './HasNoFolders';

interface Props {
    shareId: string;
    selectedItems: DecryptedLink[];
    onClose?: () => void;
    open?: boolean;
}

const MoveToFolderModal = ({ shareId, selectedItems, onClose, open }: Props) => {
    const { createModal } = useModals();
    const { moveLinks } = useActions();
    const {
        rootItems,
        expand,
        toggleExpand,
        isLoaded: isTreeLoaded,
        rootLinkId,
    } = useFolderTreeModals(shareId, { rootExpanded: true });

    const [loading, withLoading] = useLoading();
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const { isNarrow } = useActiveBreakpoint();

    const moveLinksToFolder = async (parentFolderId: string) => {
        await moveLinks(new AbortController().signal, shareId, selectedItems, parentFolderId);
    };

    const onSelect = (link: DecryptedLink) => {
        if (!loading) {
            setSelectedFolder(link.linkId);
        }
    };

    const handleSubmit = async () => {
        if (selectedFolder) {
            await moveLinksToFolder(selectedFolder);
            onClose?.();
        }
    };

    const handleCreateNewFolderClick = (parentFolderId: string) => {
        createModal(
            <CreateFolderModal
                folder={{ shareId: shareId, linkId: parentFolderId }}
                onCreateDone={async (newFolderId) => {
                    expand(parentFolderId);
                    setSelectedFolder(newFolderId);
                }}
            />
        );
    };

    const itemsToMove = selectedItems.map((item) => item.linkId);
    const itemsToMoveCount = itemsToMove.length;
    const messages = {
        allFiles: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} file`,
            `Move ${itemsToMoveCount} files`,
            itemsToMoveCount
        ),
        allFolders: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} folder`,
            `Move ${itemsToMoveCount} folders`,
            itemsToMoveCount
        ),
        mixed: c('Notification').ngettext(
            msgid`Move ${itemsToMoveCount} item`,
            `Move ${itemsToMoveCount} items`,
            itemsToMoveCount
        ),
    };

    const moveIsDisabled =
        !selectedFolder ||
        selectedItems.some((item) =>
            [
                item.linkId, // Moving folder to its own folder is not possible.
                item.parentLinkId, // Moving item to the same location is no-op.
            ].includes(selectedFolder)
        );

    let modalContents = {
        title: selectMessageForItemList(
            selectedItems.map((item) => item.isFile),
            messages
        ),
        content: rootItems && rootItems.length && (
            <FolderTree
                treeItems={rootItems}
                isLoaded={isTreeLoaded}
                selectedItemId={selectedFolder}
                rowIsDisabled={(item: TreeItem) => itemsToMove.includes(item.link.linkId)}
                onSelect={onSelect}
                toggleExpand={toggleExpand}
            />
        ),
        footer: (
            <ModalTwoFooter>
                <div className="flex flex-justify-space-between w100 flex-nowrap">
                    {isNarrow ? (
                        <Button
                            icon
                            disabled={loading || !selectedFolder}
                            onClick={() => selectedFolder && handleCreateNewFolderClick(selectedFolder)}
                            title={c('Action').t`Create new folder`}
                        >
                            <Icon name="folder-plus" />
                        </Button>
                    ) : (
                        <UnderlineButton
                            disabled={loading || !selectedFolder}
                            onClick={() => selectedFolder && handleCreateNewFolderClick(selectedFolder)}
                        >
                            {c('Action').t`Create new folder`}
                        </UnderlineButton>
                    )}
                    <div>
                        <Button type="reset" disabled={loading} autoFocus>
                            {c('Action').t`Close`}
                        </Button>
                        <PrimaryButton className="ml1" loading={loading} type="submit" disabled={moveIsDisabled}>
                            {c('Action').t`Move`}
                        </PrimaryButton>
                    </div>
                </div>
            </ModalTwoFooter>
        ) as ReactNode,
    };

    if (isTreeLoaded && rootItems.length === 0 && rootLinkId) {
        modalContents = {
            content: (
                <HasNoFolders
                    onCreate={() => {
                        onClose?.();
                        handleCreateNewFolderClick(rootLinkId);
                    }}
                />
            ),
            title: '',
            footer: null,
        };
    }

    return (
        <ModalTwo
            onClose={onClose}
            open={open}
            size="large"
            as="form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            onReset={() => {
                onClose?.();
            }}
        >
            <ModalTwoHeader title={modalContents.title} closeButtonProps={{ disabled: loading }} />
            {!rootItems.length || !isTreeLoaded ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
                <>
                    <ModalTwoContent>{modalContents.content}</ModalTwoContent>
                    {modalContents.footer}
                </>
            )}
        </ModalTwo>
    );
};

export default MoveToFolderModal;
