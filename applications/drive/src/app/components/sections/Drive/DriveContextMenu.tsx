import { ContextSeparator } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink, useDriveSharingFeatureFlag } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useMoveToFolderModal } from '../../modals/MoveToFolderModal/MoveToFolderModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useRevisionsModal } from '../../modals/RevisionsModal/RevisionsModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import {
    CopyLinkButton,
    DetailsButton,
    DownloadButton,
    PreviewButton,
    RenameButton,
    RevisionsButton,
    ShareLinkButton,
} from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import ShareLinkButtonLEGACY from '../ContextMenu/buttons/_legacy/ShareLinkButtonLEGACY';
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

    const [revisionsModal, showRevisionsModal] = useRevisionsModal();
    const driveSharing = useDriveSharingFeatureFlag();

    const ShareLinkButtonComponent = driveSharing ? ShareLinkButton : ShareLinkButtonLEGACY;

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
                    <ShareLinkButtonComponent
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
                {isOnlyOneFileItem && (
                    <>
                        <RevisionsButton
                            selectedLink={selectedLink}
                            showRevisionsModal={showRevisionsModal}
                            close={close}
                        />
                        <ContextSeparator />
                    </>
                )}
                <MoveToTrashButton selectedLinks={selectedLinks} close={close} />
                {children}
            </ItemContextMenu>
            {filesDetailsModal}
            {detailsModal}
            {moveToFolderModal}
            {renameModal}
            {linkSharingModal}
            {revisionsModal}
        </>
    );
}
