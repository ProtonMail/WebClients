import { useCallback } from 'react';
import { c } from 'ttag';

import { useSearchView } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { FileBrowser } from '../../FileBrowser';
import generateSearchItemContextMenu from './SearchItemContextMenu';
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

    const handleClick = useCallback(
        async (item: { linkId: string; isFile: boolean }) => {
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.linkId, item.isFile);
        },
        [navigateToLink, shareId]
    );

    return !items.length && !isLoading ? (
        <NoSearchResultsView />
    ) : (
        <FileBrowser
            type="search"
            layout={layout}
            caption={c('Title').t`Search results`}
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
            ItemContextMenu={generateSearchItemContextMenu(shareId, selectedItems)}
        />
    );
};
