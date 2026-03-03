import type React from 'react';

import { useShallow } from 'zustand/react/shallow';

import isTruthy from '@proton/utils/isTruthy';

import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import { SharedByMeActions } from './actions/SharedByMeActions';
import { createItemChecker } from './actions/actionsItemsChecker';
import { useSharedByMeActions } from './actions/useSharedByMeActions';
import { useSharedByMeStore } from './useSharedByMe.store';

interface SharedByMeItemContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
}

export function SharedByMeItemContextMenu({ anchorRef }: SharedByMeItemContextMenuProps) {
    const { isOpen, open, close, position } = useContextMenuStore();
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
    const selectedItems = useSharedByMeStore(
        useShallow((state) =>
            Array.from(selectedItemIds)
                .map((id) => state.sharedByMeItems.get(id))
                .filter(isTruthy)
        )
    );

    const itemChecker = createItemChecker(selectedItems);
    const selectedUids = selectedItems.map((item) => item.nodeUid);

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SharedByMeActions
                    itemChecker={itemChecker}
                    selectedUids={selectedUids}
                    buttonType="contextMenu"
                    close={close}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDetails={handleDetails}
                    onRename={handleRename}
                    onShare={handleShare}
                    onStopSharing={handleStopSharing}
                    onOpenDocsOrSheets={handleOpenDocsOrSheets}
                />
            </ItemContextMenu>
            {modals.previewModal}
            {modals.renameModal}
            {modals.detailsModal}
            {modals.sharingModal}
            {modals.confirmModal}
        </>
    );
}
