import React, { useCallback, useRef } from 'react';
import { c } from 'ttag';
import EmptyTrash from '../../FileBrowser/EmptyTrash';
import useOnScrollEnd from '../../../hooks/util/useOnScrollEnd';
import { useTrashContent } from './TrashContentProvider';
import FileBrowser from '../../FileBrowser/FileBrowser';
import { useFileBrowserLayout } from '../../FileBrowser/FileBrowserLayoutProvider';

interface Props {
    shareId: string;
}

function Trash({ shareId }: Props) {
    const { view } = useFileBrowserLayout('trash');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useTrashContent();

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
    }, [initialized, complete, loadNextPage, view]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, view]);

    return complete && !contents.length && !loading ? (
        <EmptyTrash />
    ) : (
        <FileBrowser
            isTrash
            view={view}
            scrollAreaRef={scrollAreaRef}
            caption={c('Title').t`Trash`}
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
}

export default Trash;
