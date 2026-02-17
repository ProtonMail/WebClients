import { c } from 'ttag';

import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { useFilesDetailsModal } from '../../../components/modals/FilesDetailsModal';
import {
    ContextMenuButton,
    DetailsButton,
    DownloadButton,
    PreviewButton,
} from '../../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { useDetailsModal } from '../../../modals/DetailsModal';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useTrashActions } from '../useTrashActions';
import { useTrashNotifications } from '../useTrashNotifications';

export function TrashItemContextMenu({
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedItems: LegacyItem[];
}) {
    const selectedItem = selectedItems[0];
    const hasPreviewAvailable =
        selectedItems.length === 1 &&
        selectedItem.isFile &&
        selectedItem.mimeType &&
        isPreviewAvailable(selectedItem.mimeType, selectedItem.size) &&
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
        selectedItem.photoProperties?.albums.every((album) => album.albumLinkId !== selectedItem.parentLinkId);

    const hasDownloadAvailable = !selectedItems.some((item) => !item.isFile);
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { confirmModal, createDeleteConfirmModal } = useTrashNotifications();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { restoreNodes, deleteNodes } = useTrashActions();

    const handleDelete = () => {
        createDeleteConfirmModal(selectedItems, () => deleteNodes(selectedItems));
    };

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton shareId={selectedItem.rootShareId} linkId={selectedItem.linkId} close={close} />
                )}
                {hasDownloadAvailable && <DownloadButton selectedBrowserItems={selectedItems} close={close} />}
                <DetailsButton
                    selectedBrowserItems={selectedItems}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                />
                <ContextMenuButton
                    name={c('Action').t`Restore from trash`}
                    icon="arrow-rotate-right"
                    testId="context-menu-restore"
                    action={() => restoreNodes(selectedItems)}
                    close={close}
                />
                <ContextMenuButton
                    name={c('Action').t`Delete permanently`}
                    icon="cross-circle"
                    testId="context-menu-delete"
                    action={() => handleDelete()}
                    close={close}
                />
            </ItemContextMenu>
            {detailsModal}
            {filesDetailsModal}
            {confirmModal}
        </>
    );
}
