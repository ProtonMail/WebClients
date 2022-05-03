import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useSearchView } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import { mapDecryptedLinksToChildren } from '../helpers';
import SearchItemContextMenu from './SearchItemContextMenu';
import { NoSearchResultsView } from './NoSearchResultsView';

interface Props {
    shareId: string;
    searchView: ReturnType<typeof useSearchView>;
}

export const Search = ({ shareId, searchView }: Props) => {
    const { navigateToLink } = useNavigate();

    const { layout, items, sortParams, setSorting, selectionControls, isLoading } = searchView;
    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        selectionControls;

    const selectedItems2 = mapDecryptedLinksToChildren(selectedItems);
    const contents = mapDecryptedLinksToChildren(items);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.IsFile);
        },
        [navigateToLink, shareId]
    );

    return !contents.length && !isLoading ? (
        <NoSearchResultsView />
    ) : (
        <FileBrowser
            type="search"
            layout={layout}
            caption={c('Title').t`Search results`}
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
            ItemContextMenu={SearchItemContextMenu}
        />
    );
};
