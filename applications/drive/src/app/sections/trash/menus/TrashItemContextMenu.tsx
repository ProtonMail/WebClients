import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { DetailsButton, DownloadButton, PreviewButton } from '../../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { DeletePermanentlyButton } from '../statelessComponents/DeletePermanentlyButton';
import { RestoreButton } from '../statelessComponents/RestoreButton';

interface Props extends ContextMenuProps {
    selectedItems: LegacyItem[];
    onRestore: (items: LegacyItem[]) => void;
    onDelete: (items: LegacyItem[]) => void;

    showDetailsModal: (...args: any[]) => void;

    showFilesDetailsModal: (...args: any[]) => void;
}

export function TrashItemContextMenu({
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    onRestore,
    onDelete,
    showDetailsModal,
    showFilesDetailsModal,
}: Props) {
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

    return (
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
            <RestoreButton buttonType="contextMenu" onClick={() => onRestore(selectedItems)} close={close} />
            <DeletePermanentlyButton buttonType="contextMenu" onClick={() => onDelete(selectedItems)} close={close} />
        </ItemContextMenu>
    );
}
