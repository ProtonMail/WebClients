import type { ContextMenuProps } from '../../components/FileBrowser';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { SharedByMeActions } from './actions/SharedByMeActions';
import { createItemChecker } from './actions/actionsItemsChecker';
import { useSharedByMeActions } from './actions/useSharedByMeActions';
import type { SharedByMeItem } from './useSharedByMe.store';

export function SharedByMeItemContextMenu({
    selectedBrowserItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedBrowserItems: SharedByMeItem[];
}) {
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

    const itemChecker = createItemChecker(selectedBrowserItems);
    const selectedUids = selectedBrowserItems.map((item) => item.nodeUid);

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
