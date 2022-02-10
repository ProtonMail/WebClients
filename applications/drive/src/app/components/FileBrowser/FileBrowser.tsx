import { useCallback, useRef } from 'react';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import { FileBrowserProps, SortField } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import ListView from './ListView/ListView';
import GridView from './GridView/GridView';

/**
 * File browser that supports grid view and list view
 * If only grid or list view is needed better use them directly
 */
const FileBrowser = <T extends SortField>({
    layout,
    loading,
    caption,
    contents,
    shareId,
    selectedItems,
    type,
    isPreview = false,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    selectItem,
    clearSelections,
    onShiftClick,
    sortFields,
    sortParams,
    setSorting,
    getDragMoveControls,
    onScrollEnd,
    ItemContextMenu,
    FolderContextMenu,
}: FileBrowserProps<T>) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleScrollEnd = useCallback(() => {
        onScrollEnd?.();
    }, [onScrollEnd, layout]);

    // On content change, check scroll end (does not rebind listeners).
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, layout]);

    return layout === LayoutSetting.Grid ? (
        <GridView
            scrollAreaRef={scrollAreaRef}
            caption={caption}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            sortFields={sortFields}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={onItemClick}
            onToggleItemSelected={onToggleItemSelected}
            clearSelections={clearSelections}
            onToggleAllSelected={onToggleAllSelected}
            onShiftClick={onShiftClick}
            selectItem={selectItem}
            getDragMoveControls={getDragMoveControls}
            ItemContextMenu={ItemContextMenu}
            FolderContextMenu={FolderContextMenu}
        />
    ) : (
        <ListView
            type={type}
            isPreview={isPreview}
            scrollAreaRef={scrollAreaRef}
            caption={caption}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            sortParams={sortParams}
            setSorting={setSorting}
            onItemClick={onItemClick}
            onToggleItemSelected={onToggleItemSelected}
            clearSelections={clearSelections}
            onToggleAllSelected={onToggleAllSelected}
            onShiftClick={onShiftClick}
            selectItem={selectItem}
            getDragMoveControls={getDragMoveControls}
            ItemContextMenu={ItemContextMenu}
            FolderContextMenu={FolderContextMenu}
        />
    );
};

export default FileBrowser;
