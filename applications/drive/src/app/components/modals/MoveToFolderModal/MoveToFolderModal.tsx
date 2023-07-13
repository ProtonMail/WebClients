import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { ModalTwo, useActiveBreakpoint, useModalTwo } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { DecryptedLink, useActions, useTreeForModals } from '../../../store';
import { selectMessageForItemList } from '../../sections/helpers';
import CreateFolderModal from '../CreateFolderModal';
import ModalContentLoader from '../ModalContentLoader';
import { ModalContent } from './ModalContent';

interface Props {
    shareId: string;
    selectedItems: DecryptedLink[];
    onClose?: () => void;
}

const MoveToFolderModal = ({ shareId, selectedItems, onClose, ...modalProps }: Props) => {
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
    const [createFolderModal, showCreateFolderModal] = useModalTwo(CreateFolderModal);

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

        void showCreateFolderModal({
            folder: { shareId: shareId, linkId: targetLinkId },
            onCreateDone: async (newFolderId: string) => {
                expand(targetLinkId);
                setSelectedFolder(newFolderId);
            },
        });
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
            {createFolderModal}
        </>
    );
};

export default MoveToFolderModal;
export const useMoveToFolderModal = (): [JSX.Element | null, ({ shareId, selectedItems }: Props) => void] => {
    const [moveToFolderModal, showMoveToFolderModal] = useModalTwo<Props, void>(MoveToFolderModal, false);

    const handleShowMoveToFolderModal = ({ shareId, selectedItems }: Props) => {
        if (!shareId || !selectedItems.length) {
            return;
        }
        void showMoveToFolderModal({ shareId, selectedItems });
    };

    return [moveToFolderModal, handleShowMoveToFolderModal];
};
