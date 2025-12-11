import type { VirtualItem } from '@tanstack/react-virtual';

import { TableCellBusy } from '@proton/components';

import { DriveExplorerRow } from './DriveExplorerRow';
import type {
    CellDefinition,
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
} from './types';

interface VirtualListItemProps {
    virtualItem: VirtualItem;
    itemId: string | undefined;
    cells: CellDefinition[];
    loading?: boolean;
    totalItemCount: number;
    conditions?: DriveExplorerConditions;
    selection: DriveExplorerSelection;
    events?: DriveExplorerEvents;
    onObserve: (element: HTMLElement | null, uid: string) => void;
    dragMoveControls?: DragMoveControls;
    isMultiSelectionDisabled?: boolean;
    showCheckboxColumn?: boolean;
    contextMenu?: (uid: string) => React.ReactNode;
}

export function VirtualListItem({
    virtualItem,
    itemId,
    cells,
    loading = false,
    totalItemCount,
    conditions,
    selection,
    events,
    onObserve,
    dragMoveControls,
    isMultiSelectionDisabled,
    showCheckboxColumn,
    contextMenu,
}: VirtualListItemProps) {
    const isLoadingRow = loading && virtualItem.index === totalItemCount;

    if (isLoadingRow) {
        return (
            <tr
                className="absolute top-0 left-0 w-full h-custom"
                key="loading"
                style={{
                    transform: `translateY(${virtualItem.start}px)`,
                    '--h-custom': `${virtualItem.size}px`,
                }}
            >
                <TableCellBusy
                    colSpan={cells.length}
                    className="flex w-full text-lg justify-center items-center m-0 h-full"
                />
            </tr>
        );
    }

    if (!itemId) {
        return null;
    }

    return (
        <DriveExplorerRow
            className="absolute top-0 left-0 w-full h-custom"
            key={itemId}
            itemId={itemId}
            cells={cells}
            style={{
                transform: `translateY(${virtualItem.start}px)`,
                '--h-custom': `${virtualItem.size}px`,
            }}
            conditions={conditions}
            selection={selection}
            events={events}
            onObserve={onObserve}
            dragMoveControls={dragMoveControls}
            isMultiSelectionDisabled={isMultiSelectionDisabled}
            showCheckboxColumn={showCheckboxColumn}
            contextMenu={contextMenu}
        />
    );
}
