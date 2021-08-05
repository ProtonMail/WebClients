import { useCallback, useRef } from 'react';

import useUserSettings from '../../hooks/drive/useUserSettings';
import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import { FileBrowserProps } from './interfaces';
import ListView from './ListView/ListView';
import GridView from './GridView/GridView';
import { LayoutSetting } from '../../interfaces/userSettings';

/**
 * File browser that supports grid view and list view
 * If only grid or list view is needed better use them directly
 */
const FileBrowser = ({
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
    sortParams,
    setSorting,
    getDragMoveControls,
    onScrollEnd,
    ItemContextMenu,
    FolderContextMenu,
}: FileBrowserProps) => {
    const { layout } = useUserSettings();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleScrollEnd = useCallback(() => {
        onScrollEnd?.();
    }, [onScrollEnd, layout]);

    // On content change, check scroll end (does not rebind listeners).
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [contents, layout]);

    return layout === LayoutSetting.Grid ? (
        <GridView
            scrollAreaRef={scrollAreaRef}
            shareId={shareId}
            loading={loading}
            contents={contents}
            selectedItems={selectedItems}
            onItemClick={onItemClick}
            onToggleItemSelected={onToggleItemSelected}
            clearSelections={clearSelections}
            onShiftClick={onShiftClick}
            selectItem={selectItem}
            getDragMoveControls={getDragMoveControls}
            type={type}
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
