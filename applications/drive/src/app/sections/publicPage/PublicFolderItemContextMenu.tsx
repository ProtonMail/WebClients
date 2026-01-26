import type { ContextMenuProps } from '../../components/FileBrowser';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { PublicFolderActions } from './actions/PublicFolderActions';
import { usePublicActions } from './actions/usePublicActions';

export function PublicFolderItemContextMenu({ anchorRef, isOpen, position, open, close }: ContextMenuProps) {
    const { modals, handlePreview, handleDownload, handleDetails, handleRename, handleDelete, handleOpenDocsOrSheets } =
        usePublicActions();
    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <PublicFolderActions
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDetails={handleDetails}
                    onDelete={handleDelete}
                    onRename={handleRename}
                    onOpenDocsOrSheets={handleOpenDocsOrSheets}
                    close={close}
                    buttonType="contextMenu"
                />
            </ItemContextMenu>
            {modals.previewModal}
            {modals.detailsModal}
            {modals.confirmModal}
            {modals.renameModal}
        </>
    );
}
