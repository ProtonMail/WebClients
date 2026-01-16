import type { RefObject } from 'react';

import { Table, TableBody } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { VirtualListItem } from './VirtualListItem';
import type {
    CellDefinition,
    ContextMenuControls,
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerConfig,
    DriveExplorerEvents,
    DriveExplorerSelection,
} from './types';
import { useItemVisibility } from './useItemVisibility';
import { useListVirtualizer } from './useListVirtualizer';

interface DriveExplorerBodyProps {
    cells: CellDefinition[];
    itemIds: string[];
    containerRef: RefObject<HTMLDivElement>;
    config?: DriveExplorerConfig;
    events?: DriveExplorerEvents;
    conditions?: DriveExplorerConditions;
    loading?: boolean;
    selection: DriveExplorerSelection;
    dragMoveControls?: DragMoveControls;
    isMultiSelectionDisabled?: boolean;
    showCheckboxColumn?: boolean;
    contextMenuControls?: ContextMenuControls;
}

export const DriveExplorerBody = ({
    cells,
    itemIds,
    containerRef,
    config,
    events,
    conditions,
    loading,
    selection,
    dragMoveControls,
    isMultiSelectionDisabled,
    showCheckboxColumn = true,
    contextMenuControls,
}: DriveExplorerBodyProps) => {
    const itemCount = loading ? itemIds.length + 1 : itemIds.length;

    const virtualizer = useListVirtualizer(
        {
            itemHeight: config?.itemHeight,
            overscan: config?.overscan,
            gap: config?.gap,
        },
        containerRef,
        itemCount
    );
    const { observeElement } = useItemVisibility({
        onItemRender: events?.onItemRender,
        threshold: 0.1,
        rootMargin: '50px',
    });

    return (
        <div ref={containerRef} className="flex-1 overflow-auto h-full max-h-full">
            {itemCount > 0 && (
                <div
                    className="w-full relative h-custom"
                    style={{
                        '--h-custom': virtualizer.getTotalSize(),
                    }}
                >
                    <Table
                        className={clsx(
                            'w-full h-custom',
                            'simple-table--is-hoverable border-none border-collapse',
                            'm-0 p-0',
                            config?.tableClassName
                        )}
                        borderWeak
                        style={{
                            '--h-custom': virtualizer.getTotalSize(),
                        }}
                    >
                        <TableBody>
                            {virtualizer.getVirtualItems().map((virtualItem) => {
                                const itemId = itemIds.at(virtualItem.index);

                                return (
                                    <VirtualListItem
                                        key={itemId || 'loading'}
                                        virtualItem={virtualItem}
                                        itemId={itemId}
                                        cells={cells}
                                        loading={loading}
                                        totalItemCount={itemIds.length}
                                        conditions={conditions}
                                        selection={selection}
                                        events={events}
                                        onObserve={observeElement}
                                        dragMoveControls={dragMoveControls}
                                        isMultiSelectionDisabled={isMultiSelectionDisabled}
                                        showCheckboxColumn={showCheckboxColumn}
                                        contextMenuControls={contextMenuControls}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};
