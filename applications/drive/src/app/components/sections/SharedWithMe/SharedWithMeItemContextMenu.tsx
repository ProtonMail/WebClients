import { ContextSeparator, useConfirmActionModal } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { DecryptedLink, ShareInvitationDetails } from '../../../store';
import { useOpenInDocs } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { DetailsButton, DownloadButton, OpenInDocsButton, PreviewButton } from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { RemoveMeButton } from './ContextMenuButtons';
import { AcceptButton } from './ContextMenuButtons/AcceptButton';
import { DeclineButton } from './ContextMenuButtons/DeclineButton';

export function SharedWithMeContextMenu({
    selectedLinks,
    selectedPendingInvitationLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    acceptInvitation,
    rejectInvitation,
}: ContextMenuProps & {
    selectedLinks: DecryptedLink[];
    selectedPendingInvitationLinks: ShareInvitationDetails[];
    acceptInvitation?: (invitationId: string) => Promise<void>;
    rejectInvitation?: (invitationId: string) => Promise<void>;
}) {
    const selectedLink = selectedLinks.at(0);
    const selectedPendingInvitationsLink = selectedPendingInvitationLinks.at(0);
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneItem &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);

    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { showOpenInDocs } = useOpenInDocs(selectedLink);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {selectedLink && (
                    <>
                        {hasPreviewAvailable && (
                            <PreviewButton
                                shareId={selectedLink.rootShareId}
                                linkId={selectedLink.linkId}
                                close={close}
                            />
                        )}
                        {isOnlyOneFileItem && showOpenInDocs && (
                            <OpenInDocsButton shareId={selectedLink.rootShareId} link={selectedLink} close={close} />
                        )}
                        <DownloadButton selectedLinks={selectedLinks} close={close} />
                        <DetailsButton
                            selectedLinks={selectedLinks}
                            showDetailsModal={showDetailsModal}
                            showFilesDetailsModal={showFilesDetailsModal}
                            close={close}
                        />
                        {!!selectedLink && (
                            <>
                                <ContextSeparator />
                                <RemoveMeButton
                                    selectedLink={selectedLink}
                                    showConfirmModal={showConfirmModal}
                                    close={close}
                                />
                            </>
                        )}
                    </>
                )}
                {acceptInvitation && rejectInvitation && selectedPendingInvitationsLink && (
                    <>
                        <AcceptButton
                            acceptInvitation={acceptInvitation}
                            invitationId={selectedPendingInvitationsLink.invitation.invitationId}
                            close={close}
                        />
                        <DeclineButton
                            rejectInvitation={rejectInvitation}
                            invitationId={selectedPendingInvitationsLink.invitation.invitationId}
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
