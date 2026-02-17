import type { ContextMenuProps } from '../../components/FileBrowser';
import { ItemContextMenu } from '../../components/sections/ContextMenu/ItemContextMenu';
import { SearchActions } from './actions/SearchActions';
import { useSearchActions } from './actions/useSearchActions';

export function SearchContextMenu({ anchorRef, isOpen, position, open, close }: ContextMenuProps) {
    const {
        modals,
        handlePreview,
        handleDownload,
        handleDetails,
        handleRename,
        handleTrash,
        handleOpenDocsOrSheets,
        handleGoToParent,
    } = useSearchActions();

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <SearchActions
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onDetails={handleDetails}
                    onTrash={handleTrash}
                    onRename={handleRename}
                    onOpenDocsOrSheets={handleOpenDocsOrSheets}
                    onGoToParent={handleGoToParent}
                    close={close}
                    buttonType="contextMenu"
                />
            </ItemContextMenu>
            {modals.previewModal}
            {modals.detailsModal}
            {modals.renameModal}
        </>
    );
}
