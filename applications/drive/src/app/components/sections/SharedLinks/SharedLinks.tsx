import { useCallback } from 'react';
import { c } from 'ttag';

import { useSharedLinksView } from '../../../store';
import { FileBrowser } from '../../FileBrowser';
import useNavigate from '../../../hooks/drive/useNavigate';
import EmptyShared from './EmptyShared';
import generateSharedLinksItemContextMenu from './SharedLinksItemContextMenu';

type Props = {
    shareId: string;
    sharedLinksView: ReturnType<typeof useSharedLinksView>;
};

const SharedLinks = ({ shareId, sharedLinksView }: Props) => {
    const { navigateToLink } = useNavigate();

    const { layout, items, sortParams, setSorting, selectionControls, isLoading } = sharedLinksView;

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
        <EmptyShared shareId={shareId} />
    ) : (
        <FileBrowser
            type="sharing"
            layout={layout}
            caption={c('Title').t`Shared`}
            shareId={shareId}
            loading={isLoading}
            contents={items}
            selectedItems={selectedItems}
            sortFields={['name', 'linkCreateTime', 'linkExpireTime', 'numAccesses']}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            ItemContextMenu={generateSharedLinksItemContextMenu(shareId, selectedItems)}
        />
    );
};

export default SharedLinks;
