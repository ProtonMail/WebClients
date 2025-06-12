import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { DecryptedLink } from '../../../store';
import { useActions } from '../../../store';
import type { ContextMenuProps } from '../../FileBrowser';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { DetailsButton, DownloadButton, PreviewButton } from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ContextMenuButtons';

export function TrashItemContextMenu({
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
    const hasPreviewAvailable =
        selectedLinks.length === 1 &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size) &&
        // Opening a file preview opens the file in the context of folder.
        // For photos in the photo stream, it is fine as it is regular folder.
        // But photos in albums only (uploaded by other users) are not in the
        // context of folder and it requires dedicated album endpoints to load
        // "folder". We do not support this in regular preview, so the easiest
        // is to disable opening preview for such a link.
        // In the future, ideally we want trash of photos to separate to own
        // screen or app, then it will not be a problem. In mid-term, we want
        // to open preview without folder context - that is to not redirect to
        // FolderContainer, but open preview on the same page. That will also
        // fix the problem with returning back to trash and stay on the same
        // place in the view.
        selectedLink.photoProperties?.albums.every((album) => album.albumLinkId !== selectedLink.parentLinkId);
    const hasDownloadAvailable = !selectedLinks.some((item) => !item.isFile);
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { deletePermanently, restoreLinks, confirmModal } = useActions();

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedLink.rootShareId} linkId={selectedLink.linkId} close={close} />
                )}
                {hasDownloadAvailable && <DownloadButton selectedBrowserItems={selectedLinks} close={close} />}
                <DetailsButton
                    selectedBrowserItems={selectedLinks}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                <RestoreFromTrashButton restoreLinks={restoreLinks} selectedLinks={selectedLinks} close={close} />
                <DeletePermanentlyButton
                    selectedLinks={selectedLinks}
                    deletePermanently={deletePermanently}
                    close={close}
                />
            </ItemContextMenu>
            {detailsModal}
            {filesDetailsModal}
            {confirmModal}
        </>
    );
}
