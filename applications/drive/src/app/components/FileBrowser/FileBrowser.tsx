import { FileBrowserProps } from './interfaces';
import ListView from './ListView/ListView';
import GridView from './GridView/GridView';
import { LayoutSetting } from '../../interfaces/userSettings';

/**
 * File browser that supports grid view and list view
 * If only grid or list view is needed better use them directly
 */
const FileBrowser = ({
    layout,
    loading,
    caption,
    contents,
    shareId,
    scrollAreaRef,
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
}: FileBrowserProps) => {
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
        />
    );
};

export default FileBrowser;
