import { useCallback } from 'react';

import { useFolderView } from '../../../store';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { DriveFolder } from '../../../hooks/drive/useActiveShare';
import EmptyFolder from './EmptyFolder';
import generateFolderContextMenu from './FolderContextMenu';
import generateDriveItemContextMenu from './DriveItemContextMenu';
import useOpenModal from '../../useOpenModal';

interface Props {
    activeFolder: DriveFolder;
    folderView: ReturnType<typeof useFolderView>;
}

function Drive({ activeFolder, folderView }: Props) {
    const { shareId } = activeFolder;

    const { navigateToLink } = useNavigate();
    const { layout, folderName, items, sortParams, setSorting, selectionControls, isLoading } = folderView;
    const { clearSelections, selectedItems, toggleSelectItem, toggleAllSelected, toggleRange, selectItem } =
        selectionControls;
    const { openPreview } = useOpenModal();

    const { getDragMoveControls } = useDriveDragMove(shareId, selectedItems, clearSelections);

    const handleClick = useCallback(
        async (item: { linkId: string; isFile: boolean }) => {
            document.getSelection()?.removeAllRanges();
            if (item.isFile) {
                openPreview(shareId, item.linkId);
                return;
            }
            navigateToLink(shareId, item.linkId, item.isFile);
        },
        [navigateToLink, shareId]
    );

    return !items.length && !isLoading ? (
        <EmptyFolder shareId={shareId} />
    ) : (
        <FileBrowser
            type="drive"
            layout={layout}
            caption={folderName}
            shareId={shareId}
            loading={isLoading}
            contents={items}
            selectedItems={selectedItems}
            sortFields={['name', 'fileModifyTime', 'size']}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            getDragMoveControls={getDragMoveControls}
            ItemContextMenu={generateDriveItemContextMenu(shareId, selectedItems)}
            FolderContextMenu={generateFolderContextMenu(shareId)}
        />
    );
}

export default Drive;
