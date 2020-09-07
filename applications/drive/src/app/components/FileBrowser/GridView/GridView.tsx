import React from 'react';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { classnames, Loader, useActiveBreakpoint } from 'react-components';
import { FileBrowserItem, FileBrowserProps } from '../interfaces';
import ItemCell, { Props as ItemCellProps } from './ItemCell';
import FolderContextMenu from '../FolderContextMenu';
import useFileBrowserView from '../useFileBrowserView';

const itemWidth = 216;
const itemHeight = 196;
const itemWidthForMobile = 195;
const itemHeightForMobile = 177;

type Props = Omit<
    FileBrowserProps,
    'view' | 'onToggleAllSelected' | 'isPreview' | 'caption' | 'setSorting' | 'sortParams'
>;

type ItemCellData = {
    loading?: boolean;
    itemsPerRow: number;
    rowCount: number;
    contents: FileBrowserItem[];
    getItemProps: (item: FileBrowserItem) => Omit<ItemCellProps, 'style'>;
};

type GridItemCellProps = Omit<GridChildComponentProps, 'data'> & {
    data: ItemCellData;
};

const GridItemCell = ({
    columnIndex,
    rowIndex,
    style,
    data: { contents, rowCount, itemsPerRow, getItemProps, loading },
}: GridItemCellProps) => {
    const currentIndex = columnIndex + rowIndex * itemsPerRow;
    const item = contents[currentIndex];
    const emptyOrLoadingCell =
        loading && (currentIndex === 0 || contents[currentIndex - 1]) ? (
            <div style={style} className="flex items-center justify-center">
                <Loader />
            </div>
        ) : null;

    return item ? (
        <ItemCell
            {...getItemProps(item)}
            className={classnames([
                columnIndex === 0 && 'pl0-5',
                rowIndex === 0 && 'pt0-5',
                columnIndex === itemsPerRow - 1 && 'pr0-5',
                rowIndex === rowCount - 1 && 'pb0-5',
            ])}
            style={style}
        />
    ) : (
        emptyOrLoadingCell
    );
};

function GridView({
    isTrash,
    shareId,
    contents,
    onItemClick,
    selectedItems,
    onShiftClick,
    selectItem,
    getDragMoveControls,
    loading,
    onToggleItemSelected,
    clearSelections,
    scrollAreaRef,
}: Props) {
    const totalItems = contents.length + (loading ? 1 : 0);
    const {
        secondaryActionActive,
        isContextMenuOpen,
        closeContextMenu,
        contextMenuPosition,
        handleContextMenu,
        openContextMenu,
    } = useFileBrowserView({
        clearSelections,
    });
    const { isTinyMobile } = useActiveBreakpoint();
    const cellWidth = isTinyMobile ? itemWidthForMobile : itemWidth;
    const cellHeight = isTinyMobile ? itemHeightForMobile : itemHeight;

    return (
        <div
            role="presentation"
            className="flex-noMinChildren flex-item-fluid flex-column"
            onContextMenu={handleContextMenu}
            onClick={clearSelections}
        >
            <AutoSizer>
                {({ width, height }) => {
                    const itemsPerRow = Math.floor(width / cellWidth);
                    const rowCount = Math.ceil(totalItems / itemsPerRow);

                    const itemData = {
                        contents,
                        rowCount,
                        itemsPerRow,
                        loading,
                        getItemProps: (item: FileBrowserItem): Omit<ItemCellProps, 'style'> => ({
                            item,
                            shareId,
                            selectedItems,
                            onToggleSelect: onToggleItemSelected,
                            onShiftClick,
                            onClick: onItemClick,
                            selectItem,
                            secondaryActionActive,
                            dragMoveControls: getDragMoveControls?.(item),
                        }),
                    };

                    return (
                        <>
                            <FixedSizeGrid
                                itemData={itemData}
                                columnWidth={cellWidth}
                                rowHeight={cellHeight}
                                height={height}
                                width={width}
                                columnCount={itemsPerRow}
                                rowCount={rowCount}
                                outerRef={scrollAreaRef}
                                onScroll={() => {
                                    if (isContextMenuOpen) {
                                        closeContextMenu();
                                    }
                                }}
                                itemKey={({
                                    columnIndex,
                                    rowIndex,
                                    data: { contents, itemsPerRow },
                                }: {
                                    columnIndex: number;
                                    rowIndex: number;
                                    data: ItemCellData;
                                }) => {
                                    const item = contents[columnIndex + rowIndex * itemsPerRow];
                                    return item?.LinkID ?? `${columnIndex}-${rowIndex}`;
                                }}
                            >
                                {GridItemCell}
                            </FixedSizeGrid>
                        </>
                    );
                }}
            </AutoSizer>

            {!isTrash && (
                <FolderContextMenu
                    isOpen={isContextMenuOpen}
                    open={openContextMenu}
                    close={closeContextMenu}
                    position={contextMenuPosition}
                    anchorRef={scrollAreaRef}
                />
            )}
        </div>
    );
}

export default GridView;
