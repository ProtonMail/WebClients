import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useConfirmActionModal } from '@proton/components';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../components/FileBrowser';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { LayoutButton } from '../../components/sections/ToolbarButtons';
import { useCopyItemsModal } from '../../modals/CopyItemsModal/CopyItemsModal';
import { useDetailsModal } from '../../modals/DetailsModal';
import { usePreviewModal } from '../../modals/preview';
import { useSelectionStore } from '../../modules/selection';
import type { DirectShareItem } from '../../zustand/sections/sharedWithMeListing.store';
import { useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import { SharedWithMeActions } from './actions/SharedWithMeActions';

interface SharedWithMeToolbarProps {
    uids: string[];
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

const SharedWithMeToolbar = ({ uids }: SharedWithMeToolbarProps) => {
    const [previewModal, showPreviewModal] = usePreviewModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();

    const useNewSelectionStore = useFlag('DriveWebNewFileBrowser');

    const { copyModal, showCopyItemsModal } = useCopyItemsModal();
    function convertDataShowModal(items: DirectShareItem[]) {
        showCopyItemsModal(items.map((item) => ({ uid: item.nodeUid, name: item.name })));
    }

    const legacySelection = useSelection();
    const { selectedItemIds: newSelectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    const selectedItemsIds = getSelectedItemsId(
        uids,
        useNewSelectionStore ? Array.from(newSelectedItemIds) : legacySelection?.selectedItemIds || []
    );

    const selectedItems = selectedItemsIds
        .map((uid) => useSharedWithMeListingStore.getState().getSharedWithMeItem(uid))
        .filter(isTruthy);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <SharedWithMeActions
                selectedItems={selectedItems}
                showPreviewModal={showPreviewModal}
                showConfirmModal={showConfirmModal}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
                showCopyModal={convertDataShowModal}
                buttonType="toolbar"
            />
        );
    };

    return (
        <>
            <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
                <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
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
        </>
    );
};

export default SharedWithMeToolbar;
