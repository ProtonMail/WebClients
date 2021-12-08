import { useCallback } from 'react';
import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useSharedLinksView } from '../../../store';
import { FileBrowser } from '../../FileBrowser';
import useNavigate from '../../../hooks/drive/useNavigate';
import { mapDecryptedLinksToChildren } from '../helpers';
import EmptyShared from './EmptyShared';
import SharedLinksItemContextMenu from './SharedLinksItemContextMenu';

type Props = {
    shareId: string;
    sharedLinksView: ReturnType<typeof useSharedLinksView>;
};

const SharedLinks = ({ shareId, sharedLinksView }: Props) => {
    const { navigateToLink } = useNavigate();

    const { layout, items, sortParams, setSorting, selectionControls, isLoading } = sharedLinksView;

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        selectionControls;

    const selectedItems2 = mapDecryptedLinksToChildren(selectedItems);
    const contents = mapDecryptedLinksToChildren(items);

    const handleClick = useCallback(
        async (item: FileBrowserItem) => {
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.LinkID, item.Type);
        },
        [navigateToLink, shareId]
    );

    return !contents.length && !isLoading ? (
        <EmptyShared shareId={shareId} />
    ) : (
        <FileBrowser
            type="sharing"
            layout={layout}
            caption={c('Title').t`Shared`}
            shareId={shareId}
            loading={isLoading}
            contents={contents}
            selectedItems={selectedItems2}
            sortFields={['name', 'linkCreateTime', 'linkExpireTime', 'numAccesses']}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={handleClick}
            onToggleItemSelected={toggleSelectItem}
            clearSelections={clearSelections}
            onToggleAllSelected={toggleAllSelected}
            onShiftClick={toggleRange}
            selectItem={selectItem}
            ItemContextMenu={SharedLinksItemContextMenu}
        />
    );
};

export default SharedLinks;
