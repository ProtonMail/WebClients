import type { useConfirmActionModal } from '@proton/components';

import type { SharedWithMeListingItemUI } from '../../../zustand/sections/sharedWithMeListing.store';
import { BookmarkActions } from './BookmarkActions';
import { DirectShareActions } from './DirectShareActions';
import { InvitationActions } from './InvitationActions';
import { createItemChecker } from './actionsItemsChecker';
import { getBookmarksIfOnly, getDirectSharesIfOnly, getInvitationsIfOnly } from './typeUtils';

interface BaseSharedWithMeActionsProps {
    selectedItems: SharedWithMeListingItemUI[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    showDetailsModal: (props: { shareId: string; linkId: string; volumeId: string }) => void;
    showFilesDetailsModal: (props: { selectedItems: { rootShareId: string; linkId: string }[] }) => void;
}

interface ContextMenuSharedWithMeActionsProps extends BaseSharedWithMeActionsProps {
    type: 'contextMenu';
    close: () => void;
}

interface ToolbarSharedWithMeActionsProps extends BaseSharedWithMeActionsProps {
    type: 'toolbar';
    close?: never;
}

type SharedWithMeActionsProps = ContextMenuSharedWithMeActionsProps | ToolbarSharedWithMeActionsProps;

export const SharedWithMeActions = ({
    selectedItems,
    showConfirmModal,
    showDetailsModal,
    showFilesDetailsModal,
    close,
    type,
}: SharedWithMeActionsProps) => {
    const itemChecker = createItemChecker(selectedItems);

    if (selectedItems.length === 0) {
        return null;
    }

    const invitations = getInvitationsIfOnly(itemChecker);
    if (invitations) {
        return (
            <InvitationActions
                selectedInvitations={invitations}
                showConfirmModal={showConfirmModal}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
        );
    }

    const bookmarks = getBookmarksIfOnly(itemChecker);
    if (bookmarks) {
        return (
            <BookmarkActions
                selectedBookmarks={bookmarks}
                showConfirmModal={showConfirmModal}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
        );
    }

    const directShares = getDirectSharesIfOnly(itemChecker);

    if (directShares) {
        return (
            <DirectShareActions
                selectedItems={directShares}
                showConfirmModal={showConfirmModal}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
        );
    }

    return null;
};
