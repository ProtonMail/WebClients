import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../components/FileBrowser';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { useRenameModal } from '../../components/modals/RenameModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import {
    DetailsButton,
    DownloadButton,
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useActions } from '../../store';
import { useOpenInDocs } from '../../store/_documents';
import { type LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { StopSharingButton } from './ContextMenuButtons/StopSharingButton';

export function SharedByMeItemContextMenu({
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedLinks: LegacyItem[];
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
                {<DownloadButton selectedBrowserItems={selectedLinks} close={close} />}
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
                        close={close}
                    />
                )}
                {/* //TODO: Add multiple share deletion support */}
                {isOnlyOneItem && selectedLink.shareId && (
                    <StopSharingButton shareId={selectedLink.shareId} stopSharing={stopSharing} close={close} />
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
