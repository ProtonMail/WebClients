import { useConfirmActionModal } from '@proton/components';

import type { ContextMenuProps } from '../../components/FileBrowser';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useCopyItemsModal } from '../../modals/CopyItemsModal';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { SharedWithMeActions } from './actions/SharedWithMeActions';
import { useResharingModal } from './useResharingModal';
import type { DirectShareItem, SharedWithMeItem } from './useSharedWithMe.store';

export function SharedWithMeContextMenu({
    selectedBrowserItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedBrowserItems: SharedWithMeItem[];
}) {
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { copyModal, showCopyItemsModal } = useCopyItemsModal();
    const { sharingModal, showSharingModal } = useResharingModal(selectedBrowserItems);
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    function convertDataShowModal(items: DirectShareItem[]) {
        showCopyItemsModal(items.map((item) => ({ uid: item.nodeUid, name: item.name })));
    }

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SharedWithMeActions
                    selectedItems={selectedBrowserItems}
                    showPreviewModal={showPreviewModal}
                    showConfirmModal={showConfirmModal}
                    showDetailsModal={showDetailsModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    showCopyModal={convertDataShowModal}
                    showSharingModal={showSharingModal}
                    close={close}
                    buttonType="contextMenu"
                />
            </ItemContextMenu>
            {previewModal}
            {detailsModal}
            {filesDetailsModal}
            {confirmModal}
            {copyModal}
            {sharingModal}
        </>
    );
}
