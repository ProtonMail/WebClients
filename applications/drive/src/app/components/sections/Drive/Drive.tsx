import { useCallback } from 'react';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useFolderView } from '../../../store';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { DriveFolder } from '../../../hooks/drive/useActiveShare';
import { mapDecryptedLinksToChildren } from '../helpers';
import EmptyFolder from './EmptyFolder';
import FolderContextMenu from './FolderContextMenu';
import DriveItemContextMenu from './DriveItemContextMenu';
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

    const selectedItems2 = mapDecryptedLinksToChildren(selectedItems);
    const contents = mapDecryptedLinksToChildren(items);

    const { getDragMoveControls } = useDriveDragMove(shareId, selectedItems2, clearSelections);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            document.getSelection()?.removeAllRanges();
            if (item.IsFile) {
                openPreview(shareId, item);
                return;
            }
            navigateToLink(shareId, item.LinkID, item.IsFile);
        },
        [navigateToLink, shareId]
    );

    return !contents.length && !isLoading ? (
        <EmptyFolder shareId={shareId} />
    ) : (
        <FileBrowser
            type="drive"
            layout={layout}
            caption={folderName}
            shareId={shareId}
            loading={isLoading}
            contents={contents}
            selectedItems={selectedItems2}
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
            ItemContextMenu={DriveItemContextMenu}
            FolderContextMenu={FolderContextMenu}
        />
    );
}

export default Drive;
