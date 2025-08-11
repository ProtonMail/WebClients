import { useConfirmActionModal } from '@proton/components';

import type { ContextMenuProps } from '../../components/FileBrowser';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { type SharedWithMeListingItemUI } from '../../zustand/sections/sharedWithMeListing.store';
import { SharedWithMeActions } from './actions/SharedWithMeActions';

export function SharedWithMeContextMenu({
    selectedBrowserItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedBrowserItems: SharedWithMeListingItemUI[];
}) {
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SharedWithMeActions
                    selectedItems={selectedBrowserItems}
                    showConfirmModal={showConfirmModal}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    close={close}
                    type="contextMenu"
                />
            </ItemContextMenu>
            {detailsModal}
            {filesDetailsModal}
            {confirmModal}
        </>
    );
}
