import { useConfirmActionModal } from '@proton/components';

import type { ContextMenuProps } from '../../components/FileBrowser';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { usePreviewModal } from '../../modals/preview';
import { SharedByMeActions } from './actions/SharedByMeActions';
import type { SharedByMeItem } from './useSharedByMe.store';

export function SharedByMeItemContextMenu({
    selectedBrowserItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedBrowserItems: SharedByMeItem[];
}) {
    const [previewModal, showPreviewModal] = usePreviewModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SharedByMeActions
                    selectedItems={selectedBrowserItems}
                    close={close}
                    buttonType="contextMenu"
                    showPreviewModal={showPreviewModal}
                    showDetailsModal={showDetailsModal}
                    showSharingModal={showSharingModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    showRenameModal={showRenameModal}
                    showConfirmModal={showConfirmModal}
                />
            </ItemContextMenu>
            {previewModal}
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {sharingModal}
            {confirmModal}
        </>
    );
}
