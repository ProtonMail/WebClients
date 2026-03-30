import type { useConfirmActionModal } from '@proton/components';

import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useFilesDetailsModal } from '../../../modals/FilesDetailsModal';
import type { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { useDrivePreviewModal } from '../../../modals/preview';
import type { DirectShareItem, SharedWithMeItem } from '../useSharedWithMe.store';
import { BookmarkActions } from './BookmarkActions';
import { DirectShareActions } from './DirectShareActions';
import { InvitationActions } from './InvitationActions';
import { createItemChecker } from './actionsItemsChecker';
import { getBookmarksIfOnly, getDirectSharesIfOnly, getInvitationsIfOnly } from './typeUtils';

interface BaseSharedWithMeActionsProps {
    selectedItems: SharedWithMeItem[];
    showPreviewModal: ReturnType<typeof useDrivePreviewModal>['showPreviewModal'];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    showDetailsModal: ReturnType<typeof useDetailsModal>['showDetailsModal'];
    showFilesDetailsModal: ReturnType<typeof useFilesDetailsModal>['showFilesDetailsModal'];
    showCopyModal: (items: DirectShareItem[]) => void;
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
}

interface ContextMenuSharedWithMeActionsProps extends BaseSharedWithMeActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarSharedWithMeActionsProps extends BaseSharedWithMeActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type SharedWithMeActionsProps = ContextMenuSharedWithMeActionsProps | ToolbarSharedWithMeActionsProps;

export const SharedWithMeActions = ({
    selectedItems,
    showPreviewModal,
    showConfirmModal,
    showDetailsModal,
    showFilesDetailsModal,
    showCopyModal,
    showSharingModal,
    close,
    buttonType,
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
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        );
    }

    const bookmarks = getBookmarksIfOnly(itemChecker);
    if (bookmarks) {
        return (
            <BookmarkActions
                selectedBookmarks={bookmarks}
                showConfirmModal={showConfirmModal}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        );
    }

    const directShares = getDirectSharesIfOnly(itemChecker);

    if (directShares) {
        return (
            <DirectShareActions
                selectedItems={directShares}
                showPreviewModal={showPreviewModal}
                showConfirmModal={showConfirmModal}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                showCopyModal={showCopyModal}
                showSharingModal={showSharingModal}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        );
    }

    return null;
};
