import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { useSearchContent } from './SearchContentProvider';
import { NoSearchResultsView } from './NoSearchResultsView';
import { SearchItemContextMenu } from './SearchItemContextMenu';

interface Props {
    shareId: string;
}

export const Search = ({ shareId }: Props) => {
    const { navigateToLink } = useNavigate();

    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useSearchContent();

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
            if (item.Type === LinkType.FOLDER) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.Type);
        },
        [navigateToLink, shareId]
    );

    return /* complete && */ !contents.length && !loading ? (
        <NoSearchResultsView />
    ) : (
        <FileBrowser
            type="search"
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
            ItemContextMenu={SearchItemContextMenu}
        />
    );
};
