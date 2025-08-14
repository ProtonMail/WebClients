import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms';
import { Toolbar, useConfirmActionModal } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../components/FileBrowser';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { LayoutButton } from '../../components/sections/ToolbarButtons';
import { useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import { SharedWithMeActions } from './actions/SharedWithMeActions';

interface SharedWithMeToolbarProps {
    shareId: string;
    uids: string[];
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

const SharedWithMeToolbar = ({ uids }: SharedWithMeToolbarProps) => {
    const selectionControls = useSelection()!;
    const { getSharedWithMeStoreItem } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
        }))
    );
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();

    const selectedItemsIds = getSelectedItemsId(uids, selectionControls.selectedItemIds);
    const selectedItems = selectedItemsIds.map((uid) => getSharedWithMeStoreItem(uid)).filter(isTruthy);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <SharedWithMeActions
                selectedItems={selectedItems}
                showConfirmModal={showConfirmModal}
                showDetailsModal={showDetailsModal}
                showFilesDetailsModal={showFilesDetailsModal}
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
            {confirmModal}
            {detailsModal}
            {filesDetailsModal}
        </>
    );
};

export default SharedWithMeToolbar;
