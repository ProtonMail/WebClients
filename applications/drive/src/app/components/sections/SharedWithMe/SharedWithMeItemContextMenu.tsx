import { ContextSeparator, useConfirmActionModal } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useOpenInDocs } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { DetailsButton, DownloadButton, OpenInDocsButton, PreviewButton } from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { AcceptButton } from './ContextMenuButtons/AcceptButton';
import { DeclineButton } from './ContextMenuButtons/DeclineButton';
import { OpenBookmarkButton } from './ContextMenuButtons/OpenBookmarkButton';
import { RemoveBookmarkButton } from './ContextMenuButtons/RemoveBookmarkButton';
import { RemoveMeButton } from './ContextMenuButtons/RemoveMeButton';
import type { SharedWithMeItem } from './SharedWithMe';

export function SharedWithMeContextMenu({
    selectedBrowserItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedBrowserItems: SharedWithMeItem[];
}) {
    const selectedBrowserItem = selectedBrowserItems.at(0);
    const isOnlyOneItem = selectedBrowserItems.length === 1 && !!selectedBrowserItem;
    const isOnlyOneFileItem = isOnlyOneItem && selectedBrowserItem.isFile;
    const hasPreviewAvailable =
        isOnlyOneItem &&
        selectedBrowserItem.isFile &&
        selectedBrowserItem.mimeType &&
        isPreviewAvailable(selectedBrowserItem.mimeType, selectedBrowserItem.size);

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { showOpenInDocs } = useOpenInDocs(selectedBrowserItem);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {selectedBrowserItem && !selectedBrowserItem.isInvitation && !selectedBrowserItem.isBookmark && (
                    <>
                        {hasPreviewAvailable && (
                            <PreviewButton
                                shareId={selectedBrowserItem.rootShareId}
                                linkId={selectedBrowserItem.linkId}
                                close={close}
                            />
                        )}
                        {isOnlyOneFileItem && showOpenInDocs && (
                            <OpenInDocsButton selectedBrowserItem={selectedBrowserItem} close={close} />
                        )}
                        <DownloadButton selectedBrowserItems={selectedBrowserItems} close={close} />
                        <DetailsButton
                            selectedBrowserItems={selectedBrowserItems}
                            showDetailsModal={showDetailsModal}
                            showFilesDetailsModal={showFilesDetailsModal}
                            close={close}
                        />
                        {!!selectedBrowserItem && (
                            <>
                                <ContextSeparator />
                                <RemoveMeButton
                                    rootShareId={selectedBrowserItem.rootShareId}
                                    showConfirmModal={showConfirmModal}
                                    close={close}
                                />
                            </>
                        )}
                    </>
                )}
                {selectedBrowserItem?.isBookmark && selectedBrowserItem.bookmarkDetails && (
                    <>
                        <OpenBookmarkButton
                            token={selectedBrowserItem.bookmarkDetails.token}
                            urlPassword={selectedBrowserItem.bookmarkDetails.urlPassword}
                            close={close}
                        />
                        <RemoveBookmarkButton
                            token={selectedBrowserItem.bookmarkDetails.token}
                            linkId={selectedBrowserItem.linkId}
                            showConfirmModal={showConfirmModal}
                            close={close}
                        />
                    </>
                )}
                {selectedBrowserItem?.acceptInvitation &&
                    selectedBrowserItem.rejectInvitation &&
                    selectedBrowserItem.invitationDetails && (
                        <>
                            <AcceptButton
                                acceptInvitation={selectedBrowserItem.acceptInvitation}
                                invitationId={selectedBrowserItem.invitationDetails.invitation.invitationId}
                                close={close}
                            />
                            <DeclineButton
                                rejectInvitation={selectedBrowserItem.rejectInvitation}
                                invitationId={selectedBrowserItem.invitationDetails.invitation.invitationId}
                                close={close}
                            />
                        </>
                    )}
            </ItemContextMenu>
            {detailsModal}
            {filesDetailsModal}
            {confirmModal}
        </>
    );
}
