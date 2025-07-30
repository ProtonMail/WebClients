import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import type { DecryptedLink } from '../../../store';
import { useActions } from '../../../store';
import { useOpenInDocs } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import {
    DetailsButton,
    DownloadButton,
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
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
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneItem &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);

    const { stopSharing, confirmModal } = useActions();

    const [renameModal, showRenameModal] = useRenameModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const openInDocs = useOpenInDocs(selectedLink);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {isOnlyOneFileItem && openInDocs.canOpen && <OpenInDocsButton {...openInDocs} close={close} />}
                {selectedLink?.type !== LinkType.ALBUM && (
                    <DownloadButton selectedBrowserItems={selectedLinks} close={close} />
                )}
                {isOnlyOneItem && <RenameButton showRenameModal={showRenameModal} link={selectedLink} close={close} />}
                <DetailsButton
                    selectedBrowserItems={selectedLinks}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                {isOnlyOneItem && (
                    <ShareLinkButton
                        volumeId={selectedLink.volumeId}
                        shareId={selectedLink.rootShareId}
                        showLinkSharingModal={showLinkSharingModal}
                        linkId={selectedLink.linkId}
                        isAlbum={selectedLink.type === LinkType.ALBUM}
                        close={close}
                    />
                )}
                {/* //TODO: Add multiple share deletion support */}
                {isOnlyOneItem && (
                    <StopSharingButton selectedLink={selectedLink} stopSharing={stopSharing} close={close} />
                )}
            </ItemContextMenu>
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {linkSharingModal}
            {confirmModal}
        </>
    );
}
