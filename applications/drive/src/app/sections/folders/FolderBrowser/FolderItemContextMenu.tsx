import { ContextSeparator } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { useDetailsModal } from '../../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import { useRevisionsModal } from '../../../components/modals/RevisionsModal/RevisionsModal';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import {
    CopyLinkButton,
    DetailsButton,
    DownloadButton,
    OpenInDocsButton,
    PreviewButton,
    ShareLinkButton,
} from '../../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { useOpenInDocs } from '../../../store/_documents';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { MoveToFolderButton, MoveToTrashButton } from '../ContextMenuButtons';
import { RenameButton } from '../ContextMenuButtons/RenameButton';
import { RevisionsButton } from '../ContextMenuButtons/RevisionsButton';

export function FolderItemContextMenu({
    role,
    shareId,
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    children,
    isActiveLinkReadOnly,
}: ContextMenuProps & {
    role: MemberRole;
    shareId: string;
    selectedItems: LegacyItem[];
    isActiveLinkReadOnly?: boolean;
}) {
    const selectedItem = selectedItems.length > 0 ? selectedItems[0] : undefined;
    const isOnlyOneItem = selectedItems.length === 1 && !!selectedItem;
    const isOnlyOneFileItem = isOnlyOneItem && selectedItem.isFile;

    const isEditor = role === MemberRole.Editor;
    const isAdmin = role === MemberRole.Admin;

    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedItem.mimeType && isPreviewAvailable(selectedItem.mimeType, selectedItem.size);
    const hasLink = isOnlyOneItem && selectedItem.shareUrl && !selectedItem.shareUrl.isExpired && !selectedItem.trashed;
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const [revisionsModal, showRevisionsModal] = useRevisionsModal();

    const openInDocs = useOpenInDocs(selectedItem);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedItem.rootShareId} linkId={selectedItem.linkId} close={close} />
                )}
                {isOnlyOneFileItem && openInDocs.canOpen && <OpenInDocsButton {...openInDocs} close={close} />}
                {(hasPreviewAvailable || (isOnlyOneFileItem && openInDocs.canOpen)) && <ContextSeparator />}
                <DownloadButton selectedBrowserItems={selectedItems} close={close} />
                {isAdmin && hasLink && (
                    <CopyLinkButton shareId={selectedItem.rootShareId} linkId={selectedItem.linkId} close={close} />
                )}
                {isAdmin && isOnlyOneItem && (
                    <ShareLinkButton
                        volumeId={selectedItem.volumeId}
                        shareId={selectedItem.rootShareId}
                        showLinkSharingModal={showLinkSharingModal}
                        linkId={selectedItem.linkId}
                        close={close}
                    />
                )}
                <ContextSeparator />
                {isEditor && !isActiveLinkReadOnly ? (
                    <MoveToFolderButton shareId={shareId} selectedItems={selectedItems} close={close} />
                ) : null}
                {isEditor && isOnlyOneItem && !isActiveLinkReadOnly && (
                    <RenameButton item={selectedItem} close={close} />
                )}
                <DetailsButton
                    selectedBrowserItems={selectedItems}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                {isEditor && <ContextSeparator />}
                {isEditor && isOnlyOneFileItem && (
                    <>
                        <RevisionsButton
                            selectedItem={selectedItem}
                            showRevisionsModal={showRevisionsModal}
                            close={close}
                        />
                        <ContextSeparator />
                    </>
                )}
                {isEditor && <MoveToTrashButton selectedItems={selectedItems} close={close} />}
                {children}
            </ItemContextMenu>
            {filesDetailsModal}
            {detailsModal}
            {linkSharingModal}
            {revisionsModal}
        </>
    );
}
