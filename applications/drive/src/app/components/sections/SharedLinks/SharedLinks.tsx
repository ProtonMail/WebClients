import { useCallback, useEffect } from 'react';
import { c } from 'ttag';

import { FileBrowser } from '../../FileBrowser';
import { useSharedLinksContent } from './SharedLinksContentProvider';
import EmptyShared from './EmptyShared';
import SharedLinksItemContextMenu from './SharedLinksItemContextMenu';
import useDriveEvents from '../../../hooks/drive/useDriveEvents';
import useDrive from '../../../hooks/drive/useDrive';

type Props = {
    shareId: string;
};

const SharedLinks = ({ shareId }: Props) => {
    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls, sortParams, setSorting } =
        useSharedLinksContent();
    const driveEvents = useDriveEvents();
    const { handleDriveEvents } = useDrive();

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage]);

    useEffect(() => {
        void driveEvents.listenForShareEvents(shareId, handleDriveEvents(shareId));
    }, [shareId]);

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
