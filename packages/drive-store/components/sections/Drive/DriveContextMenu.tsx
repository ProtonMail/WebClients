import { useMemo } from 'react';

import { ContextSeparator } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { DecryptedLink } from '../../../store';
import { useOpenInDocs } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser/interface';
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
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
    RevisionsButton,
    ShareLinkButton,
} from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { MoveToFolderButton, MoveToTrashButton } from './ContextMenuButtons';

export function DriveItemContextMenu({
    permissions,
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
    permissions: SHARE_MEMBER_PERMISSIONS;
    shareId: string;
    selectedLinks: DecryptedLink[];
    isActiveLinkReadOnly?: boolean;
}) {
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasLink = isOnlyOneItem && selectedLink.shareUrl && !selectedLink.shareUrl.isExpired && !selectedLink.trashed;
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [moveToFolderModal, showMoveToFolderModal] = useMoveToFolderModal();
    const [renameModal, showRenameModal] = useRenameModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const [revisionsModal, showRevisionsModal] = useRevisionsModal();

    const openInDocs = useOpenInDocs(selectedLink);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {isOnlyOneFileItem && openInDocs.canOpen && <OpenInDocsButton {...openInDocs} close={close} />}
                {(hasPreviewAvailable || (isOnlyOneFileItem && openInDocs.canOpen)) && <ContextSeparator />}
                <DownloadButton selectedBrowserItems={selectedLinks} close={close} />
                {isAdmin && hasLink && (
                    <CopyLinkButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {isAdmin && isOnlyOneItem && (
                    <ShareLinkButton
                        shareId={selectedLink.rootShareId}
                        showLinkSharingModal={showLinkSharingModal}
                        linkId={selectedLink.linkId}
                        close={close}
                    />
                )}
                <ContextSeparator />
                {isEditor && !isActiveLinkReadOnly ? (
                    <MoveToFolderButton
                        shareId={shareId}
                        selectedLinks={selectedLinks}
                        showMoveToFolderModal={showMoveToFolderModal}
                        close={close}
                    />
                ) : null}
                {isEditor && isOnlyOneItem && !isActiveLinkReadOnly && (
                    <RenameButton showRenameModal={showRenameModal} link={selectedLink} close={close} />
                )}
                <DetailsButton
                    selectedBrowserItems={selectedLinks}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                {isEditor && <ContextSeparator />}
                {isEditor && isOnlyOneFileItem && (
                    <>
                        <RevisionsButton
                            selectedLink={selectedLink}
                            showRevisionsModal={showRevisionsModal}
                            close={close}
                        />
                        <ContextSeparator />
                    </>
                )}
                {isEditor && <MoveToTrashButton selectedLinks={selectedLinks} close={close} />}
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
