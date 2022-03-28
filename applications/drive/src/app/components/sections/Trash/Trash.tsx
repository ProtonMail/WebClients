import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useTrashView } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { mapDecryptedLinksToChildren } from '../helpers';
import EmptyTrash from './EmptyTrash';
import TrashItemContextMenu from './TrashItemContextMenu';

interface Props {
    shareId: string;
    trashView: ReturnType<typeof useTrashView>;
}

function Trash({ shareId, trashView }: Props) {
    const { navigateToLink } = useNavigate();

    const { layout, items, sortParams, setSorting, selectionControls, isLoading } = trashView;

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        selectionControls;

    const selectedItems2 = mapDecryptedLinksToChildren(selectedItems);
    const contents = mapDecryptedLinksToChildren(items);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            // Trashed folders are not possible to browse.
            if (!item.IsFile) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.IsFile);
        },
        [navigateToLink, shareId]
    );

    return !contents.length && !isLoading ? (
        <EmptyTrash />
    ) : (
        <FileBrowser
            type="trash"
            layout={layout}
            caption={c('Title').t`Trash`}
            shareId={shareId}
            loading={isLoading}
            contents={contents}
            selectedItems={selectedItems2}
            sortFields={['name', 'trashed', 'size']}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            ItemContextMenu={TrashItemContextMenu}
        />
    );
}

export default Trash;
