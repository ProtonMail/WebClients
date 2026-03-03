import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { LayoutButton, ShareButton } from '../../components/sections/ToolbarButtons';
import { useSelectionStore } from '../../modules/selection';
import { SharedByMeActions } from './actions/SharedByMeActions';
import { createItemChecker } from './actions/actionsItemsChecker';
import { useSharedByMeActions } from './actions/useSharedByMeActions';
import { useSharedByMeStore } from './useSharedByMe.store';

const SharedByMeToolbar = () => {
    const {
        modals,
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleShare,
        handleStopSharing,
        handleOpenDocsOrSheets,
    } = useSharedByMeActions();

    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));
    const { getSharedByMeItem } = useSharedByMeStore(
        useShallow((state) => ({
            getSharedByMeItem: state.getSharedByMeItem,
        }))
    );

    const selectedItems = Array.from(selectedItemIds)
        .map((uid) => getSharedByMeItem(uid))
        .filter(isTruthy);
    const itemChecker = createItemChecker(selectedItems);
    const selectedUids = selectedItems.map((item) => item.nodeUid);

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return <ShareButton />;
        }

        return (
            <SharedByMeActions
                itemChecker={itemChecker}
                selectedUids={selectedUids}
                buttonType="toolbar"
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDetails={handleDetails}
                onRename={handleRename}
                onShare={handleShare}
                onStopSharing={handleStopSharing}
                onOpenDocsOrSheets={handleOpenDocsOrSheets}
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
            {modals.previewModal}
            {modals.renameModal}
            {modals.detailsModal}
            {modals.sharingModal}
            {modals.confirmModal}
        </Toolbar>
    );
};

export default SharedByMeToolbar;
