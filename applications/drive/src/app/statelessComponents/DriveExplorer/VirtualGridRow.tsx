import type { VirtualItem } from '@tanstack/react-virtual';

import { Loader } from '@proton/components';

import { DriveExplorerGridBox } from './DriveExplorerGridBox';
import type {
    ContextMenuControls,
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    GridDefinition,
} from './types';

interface VirtualGridRowProps {
    virtualRow: VirtualItem;
    itemIds: string[];
    itemsPerRow: number;
    cellHeight: number;
    rowCount: number;
    loading?: boolean;
    selection: DriveExplorerSelection;
    grid: GridDefinition;
    events?: DriveExplorerEvents;
    conditions?: DriveExplorerConditions;
    isMultiSelectionDisabled?: boolean;
    dragMoveControls?: DragMoveControls;
    showCheckboxColumn?: boolean;
    contextMenuControls?: ContextMenuControls;
    onObserve: (element: HTMLElement | null, uid: string) => void;
}

export function VirtualGridRow({
    virtualRow,
    itemIds,
    itemsPerRow,
    cellHeight,
    rowCount,
    loading,
    selection,
    grid,
    events,
    conditions,
    isMultiSelectionDisabled,
    dragMoveControls,
    showCheckboxColumn,
    contextMenuControls,
    onObserve,
}: VirtualGridRowProps) {
    const startIndex = virtualRow.index * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, itemIds.length);
    const itemsInRow = itemIds.slice(startIndex, endIndex);
    const isLastRow = virtualRow.index === rowCount - 1;

    return (
        <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full h-custom p-4"
            style={{
                '--h-custom': `${cellHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
            }}
        >
            <div
                className="w-full gap-4 h-custom"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
                    '--h-custom': `${cellHeight}px`,
                }}
            >
                {itemsInRow.map((itemId, colIndex) => {
                    const index = startIndex + colIndex;
                    return (
                        <DriveExplorerGridBox
                            key={itemId}
                            index={index}
                            onObserve={onObserve}
                            itemId={itemId}
                            selection={selection}
                            grid={grid}
                            events={events}
                            conditions={conditions}
                            isMultiSelectionDisabled={isMultiSelectionDisabled}
                            dragMoveControls={dragMoveControls}
                            showCheckboxColumn={showCheckboxColumn}
                            contextMenuControls={contextMenuControls}
                        />
                    );
                })}
                {loading && isLastRow && itemsInRow.length < itemsPerRow && (
                    <div className="flex items-center justify-center">
                        <Loader />
                    </div>
                )}
            </div>
        </div>
    );
}
