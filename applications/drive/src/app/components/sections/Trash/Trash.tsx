import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { useTrashContent } from './TrashContentProvider';
import EmptyTrash from './EmptyTrash';
import TrashItemContextMenu from './TrashItemContextMenu';

interface Props {
    shareId: string;
}

function Trash({ shareId }: Props) {
    const { navigateToLink } = useNavigate();

    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useTrashContent();

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            // Trashed folders are not possible to browse.
            if (item.Type === LinkType.FOLDER) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.Type);
        },
        [navigateToLink, shareId]
    );

    return complete && !contents.length && !loading ? (
        <EmptyTrash />
    ) : (
        <FileBrowser
            type="trash"
            caption={c('Title').t`Trash`}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            onItemClick={handleClick}
            onScrollEnd={handleScrollEnd}
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
