import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useConfirmActionModal } from '@proton/components';
import { useSharingModal } from '@proton/drive/modules/sharingModal';
import isTruthy from '@proton/utils/isTruthy';

import { LayoutButton } from '../../components/sections/ToolbarButtons';
import { useCopyItemsModal } from '../../modals/CopyItemsModal';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useFilesDetailsModal } from '../../modals/FilesDetailsModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { useSelectionStore } from '../../modules/selection';
import { SharedWithMeActions } from './actions/SharedWithMeActions';
import type { DirectShareItem } from './types';
import { useSharedWithMeStore } from './useSharedWithMe.store';

interface SharedWithMeToolbarProps {
    uids: string[];
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

const SharedWithMeToolbar = ({ uids }: SharedWithMeToolbarProps) => {
    const { selectedItemIds: newSelectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    const selectedItemsIds = getSelectedItemsId(uids, Array.from(newSelectedItemIds));

    const selectedItems = selectedItemsIds
        .map((uid) => useSharedWithMeStore.getState().getSharedWithMeItem(uid))
        .filter(isTruthy);

    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const { sharingModal, showSharingModal } = useSharingModal();
    const { filesDetailsModal, showFilesDetailsModal } = useFilesDetailsModal();

    const { copyModal, showCopyItemsModal } = useCopyItemsModal();
    function convertDataShowModal(items: DirectShareItem[]) {
        showCopyItemsModal(items.map((item) => ({ uid: item.nodeUid, name: item.name })));
    }

    return (
        <>
            <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
                <div className="gap-2 flex flex-nowrap shrink-0">
                    {selectedItems.length ? (
                        <SharedWithMeActions
                            selectedItems={selectedItems}
                            showPreviewModal={showPreviewModal}
                            showConfirmModal={showConfirmModal}
                            showDetailsModal={showDetailsModal}
                            showFilesDetailsModal={showFilesDetailsModal}
                            showCopyModal={convertDataShowModal}
                            showSharingModal={showSharingModal}
                            buttonType="toolbar"
                        />
                    ) : null}
                </div>
                <span className="ml-auto flex flex-nowrap shrink-0">
                    {selectedItems.length ? <Vr className="hidden lg:flex mx-2" /> : null}
                    <LayoutButton />
                </span>
            </Toolbar>
            {previewModal}
            {confirmModal}
            {detailsModal}
            {filesDetailsModal}
            {copyModal}
            {sharingModal}
        </>
    );
};

export default SharedWithMeToolbar;
