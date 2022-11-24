import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { ModalTwo, useActiveBreakpoint, useLoading, useModals } from '@proton/components';

import { DecryptedLink, useActions, useTreeForModals } from '../../store';
import CreateFolderModal from '../CreateFolderModal';
import ModalContentLoader from '../ModalContentLoader';
import { selectMessageForItemList } from '../sections/helpers';
import { ModalContent } from './ModalContent';

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
    } = useTreeForModals(shareId, { rootExpanded: true, foldersOnly: true });

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

    const handleCreateNewFolderClick = (selectedItemParentLinkId?: string) => {
        if (rootItems.length > 1 && selectedItemParentLinkId === undefined) {
            return;
        }

        const targetLinkId = selectedItemParentLinkId || rootItems[0]?.link.linkId || selectedItems[0]?.parentLinkId;

        if (!targetLinkId) {
            return;
        }

        createModal(
            <CreateFolderModal
                folder={{ shareId: shareId, linkId: targetLinkId }}
                onCreateDone={async (newFolderId) => {
                    expand(targetLinkId);
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

    const isMoveDisabled =
        !selectedFolder ||
        selectedItems.some((item) =>
            [
                item.linkId, // Moving folder to its own folder is not possible.
                item.parentLinkId, // Moving item to the same location is no-op.
            ].includes(selectedFolder)
        );

    const title = selectMessageForItemList(
        selectedItems.map((item) => item.isFile),
        messages
    );

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
            {isTreeLoaded ? (
                <ModalContent
                    isLoading={loading}
                    isTreeLoaded={isTreeLoaded}
                    title={title}
                    rootItems={rootItems}
                    selectedLinkId={selectedFolder}
                    isMoveDisabled={isMoveDisabled}
                    isMobile={isNarrow}
                    toggleExpand={toggleExpand}
                    onSelect={onSelect}
                    onCreate={handleCreateNewFolderClick}
                />
            ) : (
                <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
            )}
        </ModalTwo>
    );
};

export default MoveToFolderModal;
