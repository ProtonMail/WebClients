import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useConfirmActionModal } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../components/FileBrowser';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { LayoutButton, ShareButton } from '../../components/sections/ToolbarButtons';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { useDrivePreviewModal } from '../../modals/preview';
import { SharedByMeActions } from './actions/SharedByMeActions';
import { useSharedByMeStore } from './useSharedByMe.store';

interface SharedByMeToolbarProps {
    uids: string[];
    shareId: string;
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

const SharedByMeToolbar = ({ uids, shareId }: SharedByMeToolbarProps) => {
    const { previewModal, showPreviewModal } = useDrivePreviewModal();
    const { renameModal, showRenameModal } = useRenameModal();
    const { detailsModal, showDetailsModal } = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const selectionControls = useSelection();
    const { getSharedByMeItem } = useSharedByMeStore(
        useShallow((state) => ({
            getSharedByMeItem: state.getSharedByMeItem,
        }))
    );

    const selectedItemsIds = selectionControls ? getSelectedItemsId(uids, selectionControls.selectedItemIds) : [];
    const selectedItems = selectedItemsIds.map((uid) => getSharedByMeItem(uid)).filter(isTruthy);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return <ShareButton shareId={shareId} />;
        }

        return (
            <SharedByMeActions
                selectedItems={selectedItems}
                showPreviewModal={showPreviewModal}
                showDetailsModal={showDetailsModal}
                showSharingModal={showSharingModal}
                showFilesDetailsModal={showFilesDetailsModal}
                showRenameModal={showRenameModal}
                showConfirmModal={showConfirmModal}
                buttonType="toolbar"
            />
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                <Vr className="hidden lg:flex mx-2" />
                <LayoutButton />
            </span>
            {previewModal}
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {sharingModal}
            {confirmModal}
        </Toolbar>
    );
};

export default SharedByMeToolbar;
