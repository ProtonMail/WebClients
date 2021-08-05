import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowser } from '../../FileBrowser';
import { useSharedLinksContent } from './SharedLinksContentProvider';
import EmptyShared from './EmptyShared';
import SharedLinksItemContextMenu from './SharedLinksItemContextMenu';

type Props = {
    shareId: string;
};

const SharedLinks = ({ shareId }: Props) => {
    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useSharedLinksContent();

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

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
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            onScrollEnd={handleScrollEnd}
            ItemContextMenu={SharedLinksItemContextMenu}
        />
    );
};

export default SharedLinks;
