import React, { useRef } from 'react';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import { classnames, Loader, useElementRect } from '@proton/components';
import { buffer } from '@proton/shared/lib/helpers/function';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import { FileBrowserItem, FileBrowserProps } from '../interfaces';
import ItemCell, { Props as ItemCellProps } from './ItemCell';
import FolderContextMenu from '../FolderContextMenu';
import useFileBrowserView from '../useFileBrowserView';

const itemWidth = 13.5 * rootFontSize; // 13.5 * 16 = we want 216px by default
const itemHeight = 12.25 * rootFontSize; // 12.25 * 16 = we want 196px by default

const calculateCellDimensions = (areaWidth: number) => {
    const rowItemCount = Math.floor(areaWidth / itemWidth);
    const expandedItemWidth = areaWidth / rowItemCount;
    const squishedItemWidth = areaWidth / (rowItemCount + 1);
    const oversizing = expandedItemWidth - itemWidth;
    const oversquishing = itemWidth - squishedItemWidth;
    const ratio = itemHeight / itemWidth;

    // If expanded width is less imperfect than squished width
    if (oversizing <= oversquishing) {
        return {
            cellWidth: expandedItemWidth,
            cellHeight: expandedItemWidth * ratio,
        };
    }

    return {
        cellWidth: squishedItemWidth,
        cellHeight: squishedItemWidth * ratio,
    };
};

type Props = Omit<
    FileBrowserProps,
    'layout' | 'onToggleAllSelected' | 'isPreview' | 'caption' | 'setSorting' | 'sortParams'
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
    type,
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
    const containerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef, buffer);
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

    const width = rect?.width ?? 0;

    const { cellHeight, cellWidth } = calculateCellDimensions(width);

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
            layoutType: type,
            onToggleSelect: onToggleItemSelected,
            onShiftClick,
            onClick: onItemClick,
            selectItem,
            secondaryActionActive,
            dragMoveControls: getDragMoveControls?.(item),
        }),
    };

    return (
        <div
            ref={containerRef}
            role="presentation"
            className="flex-no-min-children flex-item-fluid flex-column no-scroll"
            onContextMenu={handleContextMenu}
            onClick={clearSelections}
        >
            {rect && (
                <FixedSizeGrid
                    style={{ overflowX: 'hidden', paddingBottom: '1.5em' }}
                    itemData={itemData}
                    columnWidth={cellWidth}
                    rowHeight={cellHeight}
                    height={rect.height}
                    width={rect.width}
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
            )}

            {type === 'drive' && (
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
