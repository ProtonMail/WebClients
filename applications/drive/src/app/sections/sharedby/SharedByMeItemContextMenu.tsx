import type { ContextMenuProps } from '../../components/FileBrowser';
import { useDetailsModal } from '../../components/modals/DetailsModal';
import { useFilesDetailsModal } from '../../components/modals/FilesDetailsModal';
import { useLinkSharingModal } from '../../components/modals/ShareLinkModal/ShareLinkModal';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useRenameModal } from '../../modals/RenameModal';
import { useActions } from '../../store';
import { SharedByMeActions } from './actions/SharedByMeActions';
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
    const [renameModal, showRenameModal] = useRenameModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [filesDetailsModal, showFilesDetailsModal] = useFilesDetailsModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    // TODO: Migrate this to SDK, and move to StopSharingButton
    const { stopSharing, confirmModal } = useActions();
    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SharedByMeActions
                    selectedItems={selectedBrowserItems}
                    close={close}
                    buttonType="contextMenu"
                    showDetailsModal={showDetailsModal}
                    showLinkSharingModal={showLinkSharingModal}
                    showFilesDetailsModal={showFilesDetailsModal}
                    showRenameModal={showRenameModal}
                    stopSharing={stopSharing}
                />
            </ItemContextMenu>
            {renameModal}
            {detailsModal}
            {filesDetailsModal}
            {linkSharingModal}
            {confirmModal}
        </>
    );
}
