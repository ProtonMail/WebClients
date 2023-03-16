import { ContextSeparator } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import { useDetailsModal } from '../../DetailsModal';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { useFilesDetailsModal } from '../../FilesDetailsModal';
import { useMoveToFolderModal } from '../../MoveToFolderModal/MoveToFolderModal';
import { useRenameModal } from '../../RenameModal';
import { useLinkSharingModal } from '../../ShareLinkModal/ShareLinkModal';
import {
    CopyLinkButton,
    DetailsButton,
    DownloadButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { MoveToFolderButton, MoveToTrashButton } from './ContextMenuButtons';

export function DriveItemContextMenu({
    shareId,
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    children,
    isActiveLinkReadOnly,
}: ContextMenuProps & {
    shareId: string;
    selectedLinks: DecryptedLink[];
    isActiveLinkReadOnly?: boolean;
}) {
    const selectedLink = selectedLinks[0];
    const isOnlyOneItem = selectedLinks.length === 1;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasLink = isOnlyOneItem && selectedLink.shareUrl && !selectedLink.shareUrl.isExpired && !selectedLink.trashed;
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {hasPreviewAvailable && <ContextSeparator />}
                <DownloadButton selectedLinks={selectedLinks} close={close} />
                {hasLink && (
                    <CopyLinkButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {isOnlyOneItem && (
                    <ShareLinkButton
                        shareId={shareId}
                        showLinkSharingModal={showLinkSharingModal}
                        link={selectedLink}
                        close={close}
                    />
                )}
                <ContextSeparator />
                {!isActiveLinkReadOnly ? (
                    <MoveToFolderButton
                        shareId={shareId}
                        selectedLinks={selectedLinks}
                        showMoveToFolderModal={showMoveToFolderModal}
                        close={close}
                    />
                ) : null}
                {isOnlyOneItem && !isActiveLinkReadOnly && (
                    <RenameButton showRenameModal={showRenameModal} link={selectedLink} close={close} />
                )}
                <DetailsButton
                    selectedLinks={selectedLinks}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                <ContextSeparator />
                <MoveToTrashButton selectedLinks={selectedLinks} close={close} />
                {children}
            </ItemContextMenu>
            {filesDetailsModal}
            {detailsModal}
            {moveToFolderModal}
            {renameModal}
            {linkSharingModal}
        </>
    );
}
