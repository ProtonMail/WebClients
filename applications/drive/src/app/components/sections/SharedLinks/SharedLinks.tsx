import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { FileBrowser } from '../../FileBrowser';
import { useSharedLinksContent } from './SharedLinksContentProvider';
import EmptyShared from './EmptyShared';
import SharedLinksItemContextMenu from './SharedLinksItemContextMenu';
import useNavigate from '../../../hooks/drive/useNavigate';
import SortDropdown from './SortDropdown';

type Props = {
    shareId: string;
};

const SharedLinks = ({ shareId }: Props) => {
    const { navigateToLink } = useNavigate();

    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls, sortParams, setSorting } =
        useSharedLinksContent();

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.Type);
        },
        [navigateToLink, shareId]
    );

    return complete && !contents.length && !loading ? (
        <EmptyShared shareId={shareId} />
    ) : (
        <FileBrowser
            type="sharing"
            caption={c('Title').t`Shared`}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            onScrollEnd={handleScrollEnd}
            ItemContextMenu={SharedLinksItemContextMenu}
            SortDropdown={SortDropdown}
        />
    );
};

export default SharedLinks;
