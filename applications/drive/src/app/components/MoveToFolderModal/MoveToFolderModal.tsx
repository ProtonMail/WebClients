import { useState, ReactNode } from 'react';
import { c, msgid } from 'ttag';

import {
    useLoading,
    PrimaryButton,
    DialogModal,
    HeaderModal,
    ContentModal,
    InnerModal,
    FooterModal,
    UnderlineButton,
    useModals,
    useActiveBreakpoint,
    Button,
    Icon,
} from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import FolderTree from '../FolderTree/FolderTree';
import { DriveFolder } from '../../hooks/drive/useActiveShare';
import HasNoFolders from './HasNoFolders';
import { selectMessageForItemList } from '../sections/helpers';
import CreateFolderModal from '../CreateFolderModal';
import ModalContentLoader from '../ModalContentLoader';
import { DecryptedLink, TreeItem, useFolderTree, useActions } from '../../store';

interface Props {
    activeFolder: DriveFolder;
    selectedItems: FileBrowserItem[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ activeFolder, selectedItems, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const { moveLinks } = useActions();
    const { rootFolder, expand, toggleExpand } = useFolderTree(activeFolder.shareId, { rootExpanded: true });

    const [loading, withLoading] = useLoading();
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const { isNarrow } = useActiveBreakpoint();

    const moveLinksToFolder = async (parentFolderId: string) => {
        await moveLinks(
            new AbortController().signal,
            activeFolder.shareId,
            selectedItems.map(({ LinkID, Name, Type }) => ({ linkId: LinkID, name: Name, type: Type })),
            parentFolderId,
            selectedItems[0]?.ParentLinkID
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
                folder={{ shareId: activeFolder.shareId, linkId: parentFolderId }}
                onCreateDone={async (newFolderId) => {
                    expand(parentFolderId);
                    setSelectedFolder(newFolderId);
                }}
            />
        );
    };

    const modalTitleID = 'MoveToFolderId';
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
        !selectedFolder || itemsToMove.includes(selectedFolder) || activeFolder.linkId === selectedFolder;

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
            <FooterModal>
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
            </FooterModal>
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
        <DialogModal modalTitleID={modalTitleID} onClose={onClose} {...rest}>
            <HeaderModal modalTitleID={modalTitleID} hasClose={!loading} onClose={onClose}>
                {modalContents.title}
            </HeaderModal>
            {!rootFolder || !rootFolder.isLoaded ? (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            ) : (
                <ContentModal
                    onSubmit={() => {
                        withLoading(handleSubmit()).catch(console.error);
                    }}
                    onReset={() => {
                        onClose?.();
                    }}
                >
                    <InnerModal>{modalContents.content}</InnerModal>
                    {modalContents.footer}
                </ContentModal>
            )}
        </DialogModal>
    );
};

export default MoveToFolderModal;
