import { useCallback, useRef } from 'react';
import { c } from 'ttag';
import EmptyTrash from '../../FileBrowser/EmptyTrash';
import useOnScrollEnd from '../../../hooks/util/useOnScrollEnd';
import { useTrashContent } from './TrashContentProvider';
import FileBrowser from '../../FileBrowser/FileBrowser';
import useUserSettings from '../../../hooks/drive/useUserSettings';

interface Props {
    shareId: string;
}

function Trash({ shareId }: Props) {
    const { layout } = useUserSettings();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { loadNextPage, loading, initialized, complete, contents, fileBrowserControls } = useTrashContent();

    const { clearSelections, selectedItems, selectItem, toggleSelectItem, toggleAllSelected, toggleRange } =
        fileBrowserControls;

    const handleScrollEnd = useCallback(() => {
        // Only load on scroll after initial load from backend
        if (initialized && !complete) {
            loadNextPage();
        }
    }, [initialized, complete, loadNextPage, layout]);

    // On content change, check scroll end (does not rebind listeners)
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, layout]);

    return complete && !contents.length && !loading ? (
        <EmptyTrash />
    ) : (
        <FileBrowser
            type="trash"
            layout={layout}
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
