import { useConfirmActionModal } from '@proton/components';

import type { ContextMenuProps } from '../../components/FileBrowser';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { useDetailsModal } from '../../modals/DetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { useDrivePublicPreviewModal } from '../../modals/preview';
import { PublicFolderActions } from './actions/PublicFolderActions';

export function PublicFolderItemContextMenu({ anchorRef, isOpen, position, open, close }: ContextMenuProps) {
    const [previewModal, showPreviewModal] = useDrivePublicPreviewModal();
    const [detailsModal, showDetailsModal] = useDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [renameModal, showRenameModal] = useRenameModal();

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <PublicFolderActions
                    showPreviewModal={showPreviewModal}
                    showDetailsModal={showDetailsModal}
                    showConfirmModal={showConfirmModal}
                    showRenameModal={showRenameModal}
                    close={close}
                    buttonType="contextMenu"
                />
            </ItemContextMenu>
            {previewModal}
            {detailsModal}
            {confirmModal}
            {renameModal}
        </>
    );
}
