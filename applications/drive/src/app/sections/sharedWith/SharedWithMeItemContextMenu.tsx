import { useConfirmActionModal } from '@proton/components';
import { useCopyItemsModal } from '@proton/drive/modals/copyItemsModal';
import { useSharingModal } from '@proton/drive/modals/sharingModal';

import type { ContextMenuProps } from '../../legacy/components/FileBrowser';
import { ItemContextMenu } from '../../legacy/components/sections/ContextMenu/ItemContextMenu';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useReportAbuseModal } from '../../modals/ReportAbuseModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { SharedWithMeActions } from './actions/SharedWithMeActions';
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
    const { filesDetailsModal, showFilesDetailsModal } = useFilesDetailsModal();
    const { copyModal, showCopyItemsModal } = useCopyItemsModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { reportAbuseModal, showReportAbuseModal } = useReportAbuseModal();

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
                    showReportAbuseModal={showReportAbuseModal}
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
            {reportAbuseModal}
        </>
    );
}
