import React, { useState, ReactNode } from 'react';
import { c, msgid } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    InnerModal,
    UnderlineButton,
    useModals,
    useActiveBreakpoint,
    Button,
    Icon,
    ModalTwoHeader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
} from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import FolderTree from '../FolderTree/FolderTree';
import HasNoFolders from './HasNoFolders';
import { selectMessageForItemList } from '../sections/helpers';
import CreateFolderModal from '../CreateFolderModal';
import ModalContentLoader from '../ModalContentLoader';
import { DecryptedLink, TreeItem, useFolderTree, useActions } from '../../store';
import { useModal } from '../../hooks/util/useModal';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ shareId, selectedItems, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const { moveLinks } = useActions();
    const { rootFolder, expand, toggleExpand } = useFolderTree(shareId, { rootExpanded: true });
    const { isOpen, onClose: handleModalClose } = useModal(onClose);

    const [loading, withLoading] = useLoading();
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const { isNarrow } = useActiveBreakpoint();

    const moveLinksToFolder = async (parentFolderId: string) => {
        await moveLinks(
            new AbortController().signal,
            shareId,
            selectedItems.map(({ ParentLinkID, LinkID, Name, Type }) => ({
                parentLinkId: ParentLinkID,
                linkId: LinkID,
                name: Name,
                type: Type,
            })),
            parentFolderId
        );
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

    const itemsToMove = selectedItems.map((item) => item.LinkID);
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
                item.LinkID, // Moving folder to its own folder is not possible.
                item.ParentLinkID, // Moving item to the same location is no-op.
            ].includes(selectedFolder)
        );

    let modalContents = {
        title: selectMessageForItemList(
            selectedItems.map((item) => item.Type),
            messages
        ),
        content: rootFolder && (
            <FolderTree
                rootFolder={rootFolder}
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

    if (rootFolder && rootFolder.isLoaded && rootFolder.children.length === 0) {
        modalContents = {
            content: (
                <HasNoFolders
                    onCreate={() => {
                        onClose?.();
                        handleCreateNewFolderClick(rootFolder.link.linkId);
                    }}
                />
            ),
            title: '',
            footer: null,
        };
    }

    return (
        <ModalTwo
            onClose={handleModalClose}
            open={isOpen}
            size="large"
            as="form"
            onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                withLoading(handleSubmit()).catch(console.error);
            }}
            onReset={() => {
                handleModalClose?.();
            }}
            {...rest}
        >
            <ModalTwoHeader title={modalContents.title} disabled={loading} />
            {!rootFolder || !rootFolder.isLoaded ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
                <>
                    <ModalTwoContent>
                        <InnerModal>{modalContents.content}</InnerModal>
                    </ModalTwoContent>
                    {modalContents.footer}
                </>
            )}
        </ModalTwo>
    );
};

export default MoveToFolderModal;
