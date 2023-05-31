import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink, useActions } from '../../../store';
import { useDriveSharingFeatureFlag } from '../../../store/_shares/useCollaborativeSharingFeatureFlag';
import { ContextMenuProps } from '../../FileBrowser';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import { DetailsButton, DownloadButton, PreviewButton, RenameButton, ShareLinkButton } from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import ShareLinkButtonLEGACY from '../ContextMenu/buttons/_legacy/ShareLinkButtonLEGACY';
import { StopSharingButton } from './ContextMenuButtons';

export function SharedLinksItemContextMenu({
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedLinks: DecryptedLink[];
}) {
    const selectedLink = selectedLinks[0];
    const isOnlyOneItem = selectedLinks.length === 1;
    const hasPreviewAvailable =
        isOnlyOneItem &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);

    const { stopSharingLinks, confirmModal } = useActions();

    const [renameModal, showRenameModal] = useRenameModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const driveSharing = useDriveSharingFeatureFlag();

    const ShareLinkButtonComponent = driveSharing ? ShareLinkButton : ShareLinkButtonLEGACY;
    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {<DownloadButton selectedLinks={selectedLinks} close={close} />}
                {isOnlyOneItem && <RenameButton showRenameModal={showRenameModal} link={selectedLink} close={close} />}
                <DetailsButton
                    selectedLinks={selectedLinks}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                {isOnlyOneItem && (
                    <ShareLinkButtonComponent
                        shareId={selectedLink.rootShareId}
                        showLinkSharingModal={showLinkSharingModal}
                        link={selectedLink}
                        close={close}
                    />
                )}
                <StopSharingButton selectedLinks={selectedLinks} stopSharingLinks={stopSharingLinks} close={close} />
            </ItemContextMenu>
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {linkSharingModal}
            {confirmModal}
        </>
    );
}
