import React, { useRef, useCallback } from 'react';
import { c } from 'ttag';
import useUserSettings from '../../hooks/drive/useUserSettings';
import FileBrowser from '../FileBrowser/FileBrowser';
import { useSharedLinksContent } from './SharedLinksContentProvider';
import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import EmptyShared from '../FileBrowser/EmptyShared';

type Props = {
    shareId: string;
};

const SharedLinks = ({ shareId }: Props) => {
    const { layout } = useUserSettings();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useSharedLinksContent();

    const {
        clearSelections,
        selectedItems,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        toggleRange,
    } = fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage, layout]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, layout]);

    return complete && !contents.length && !loading ? (
        <EmptyShared shareId={shareId} />
    ) : (
        <FileBrowser
            type="sharing"
            layout={layout}
            scrollAreaRef={scrollAreaRef}
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
        />
    );
};

export default SharedLinks;
