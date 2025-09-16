import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms';
import { Toolbar, useConfirmActionModal } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../components/FileBrowser';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import { LayoutButton, ShareButton } from '../../components/sections/ToolbarButtons';
import { useRenameModal } from '../../modals/RenameModal';
import { SharedByMeActions } from './actions/SharedByMeActions';
import { useSharedByMeStore } from './useSharedByMe.store';

interface SharedByMeToolbarProps {
    uids: string[];
    shareId: string;
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

const SharedByMeToolbar = ({ uids, shareId }: SharedByMeToolbarProps) => {
    const [renameModal, showRenameModal] = useRenameModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
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
                showDetailsModal={showDetailsModal}
                showLinkSharingModal={showLinkSharingModal}
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
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {linkSharingModal}
            {confirmModal}
        </Toolbar>
    );
};

export default SharedByMeToolbar;
