import React, { useState } from 'react';

import { c } from 'ttag';

import { ModalTwo, useActiveBreakpoint, useModalTwoStatic } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';

import type { MoveItemsModalStateItem } from '../../../modals/MoveItemsModal/useMoveItemsModalState';
import type { DecryptedLink } from '../../../store';
import { useActions, useTreeForModals } from '../../../store';
import { getMovedFiles } from '../../../utils/moveTexts';
import { selectMessageForItemList } from '../../sections/helpers';
import { useCreateFolderModalDeprecated } from '../CreateFolderModal';
import ModalContentLoader from '../ModalContentLoader';
import { ModalContent } from './ModalContent';

interface Props {
    shareId: string;
    selectedItems: MoveItemsModalStateItem[];
    onClose?: () => void;
    onSuccess?: (items: { uid: string; parentUid: string | undefined }[]) => void;
}

const MoveToFolderModalDeprecated = ({ shareId, selectedItems, onClose, ...modalProps }: Props) => {
    const { moveLinks } = useActions();
    const {
        rootItems,
        expand,
        toggleExpand,
        isLoaded: isTreeLoaded,
    } = useTreeForModals(shareId, { rootExpanded: true, foldersOnly: true });
    const [loading, withLoading] = useLoading();
    const [selectedFolder, setSelectedFolder] = useState<string>();
    const { viewportWidth } = useActiveBreakpoint();
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModalDeprecated();

    const moveLinksToFolder = async (parentFolderId: string) => {
        await moveLinks(new AbortController().signal, {
            shareId,
            linksToMove: selectedItems,
            newParentLinkId: parentFolderId,
        });
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
        const targetVolumeId = rootItems[0]?.link.volumeId;

        if (!targetLinkId) {
            return;
        }

        const activeFolderUid = generateNodeUid(targetVolumeId, targetLinkId);
        void showCreateFolderModal({
            parentFolderUid: activeFolderUid,
            onSuccess: async ({ nodeId }) => {
                expand(targetLinkId);
                setSelectedFolder(nodeId);
            },
        });
    };

    const itemsToMove = selectedItems.map((item) => item.linkId);
    const itemsToMoveCount = itemsToMove.length;
    const messages = getMovedFiles(itemsToMoveCount);

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
                        isSmallViewport={viewportWidth['<=small']}
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

export const useMoveToFolderModalDeprecated = () => useModalTwoStatic(MoveToFolderModalDeprecated);
