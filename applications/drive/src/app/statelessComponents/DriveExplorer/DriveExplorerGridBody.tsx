import { type RefObject, useRef } from 'react';

import { useElementRect } from '@proton/components';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { VirtualGridRow } from './VirtualGridRow';
import type {
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerConfig,
    DriveExplorerEvents,
    DriveExplorerSelection,
    GridDefinition,
} from './types';
import { useGridVirtualizer } from './useGridVirtualizer';
import { useItemVisibility } from './useItemVisibility';

interface DriveExplorerGridBodyProps {
    grid: GridDefinition;
    itemIds: string[];
    containerRef: RefObject<HTMLDivElement>;
    config?: DriveExplorerConfig;
    events?: DriveExplorerEvents;
    conditions?: DriveExplorerConditions;
    loading?: boolean;
    selection: DriveExplorerSelection;
    isMultiSelectionDisabled?: boolean;
    dragMoveControls?: DragMoveControls;
    showCheckboxColumn?: boolean;
    contextMenu?: (uid: string) => React.ReactNode;
}

const calculateCellDimensions = (areaWidth: number) => {
    const itemWidth = 13.5 * rootFontSize(); // 13.5 * 16 = 216px by default
    const itemHeight = 12.25 * rootFontSize(); // 12.25 * 16 = 196px by default

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

export const DriveExplorerGridBody = ({
    itemIds,
    grid,
    config,
    containerRef,
    events,
    conditions,
    loading,
    selection,
    isMultiSelectionDisabled,
    dragMoveControls,
    showCheckboxColumn = true,
    contextMenu,
}: DriveExplorerGridBodyProps) => {
    const gridContainerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(gridContainerRef);

    const { observeElement } = useItemVisibility({
        onItemRender: events?.onItemRender,
        threshold: 0.1,
        rootMargin: '50px',
    });

    const width = rect?.width ?? 0;
    const { cellHeight, cellWidth } = calculateCellDimensions(width);
    const itemsPerRow = cellWidth > 0 ? Math.max(1, Math.floor(width / cellWidth)) : 1;
    const totalItems = itemIds.length + (loading ? 1 : 0);
    const rowCount = Math.ceil(totalItems / itemsPerRow);

    const gap = 16; // 1rem = 16px
    const rowHeightWithGap = cellHeight + gap;

    const virtualizer = useGridVirtualizer(
        {
            itemsPerRow,
            rowHeight: rowHeightWithGap,
            overscan: config?.overscan,
            gap: config?.gap,
        },
        containerRef,
        totalItems
    );

    return (
        <div ref={containerRef} className="h-full max-h-full overflow-x-hidden flex-1 overflow-auto">
            <div ref={gridContainerRef} className="w-full h-full">
                <div
                    className="w-full h-custom relative"
                    style={{
                        '--h-custom': virtualizer.getTotalSize(),
                    }}
                >
                    {rect &&
                        virtualizer.getVirtualItems().map((virtualRow) => {
                            return (
                                <VirtualGridRow
                                    key={virtualRow.key}
                                    virtualRow={virtualRow}
                                    itemIds={itemIds}
                                    itemsPerRow={itemsPerRow}
                                    cellHeight={cellHeight}
                                    rowCount={rowCount}
                                    loading={loading}
                                    selection={selection}
                                    grid={grid}
                                    events={events}
                                    conditions={conditions}
                                    isMultiSelectionDisabled={isMultiSelectionDisabled}
                                    dragMoveControls={dragMoveControls}
                                    showCheckboxColumn={showCheckboxColumn}
                                    contextMenu={contextMenu}
                                    onObserve={observeElement}
                                />
                            );
                        })}
                </div>
            </div>
        </div>
    );
};
