import { useCallback } from 'react';
import { c } from 'ttag';

import { useTrashView } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import EmptyTrash from './EmptyTrash';
import generateTrashItemContextMenu from './TrashItemContextMenu';

interface Props {
    shareId: string;
    trashView: ReturnType<typeof useTrashView>;
}

function Trash({ shareId, trashView }: Props) {
    const { navigateToLink } = useNavigate();

    const { layout, items, sortParams, setSorting, selectionControls, isLoading } = trashView;

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        selectionControls;

    const handleClick = useCallback(
        async (item: { linkId: string; isFile: boolean }) => {
            // Trashed folders are not possible to browse.
            if (!item.isFile) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.linkId, item.isFile);
        },
        [navigateToLink, shareId]
    );

    return !items.length && !isLoading ? (
        <EmptyTrash />
    ) : (
        <FileBrowser
            type="trash"
            layout={layout}
            caption={c('Title').t`Trash`}
            shareId={shareId}
            loading={isLoading}
            contents={items}
            selectedItems={selectedItems}
            sortFields={['name', 'trashed', 'size']}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            ItemContextMenu={generateTrashItemContextMenu(shareId, selectedItems)}
        />
    );
}

export default Trash;
