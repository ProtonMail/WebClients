import type { RefObject } from 'react';

import { Table, TableBody } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { VirtualListItem } from './VirtualListItem';
import { defaultConfig } from './constants';
import type {
    CellDefinition,
    ContextMenuControls,
    DragMoveControls,
    DriveExplorerA11y,
    DriveExplorerConditions,
    DriveExplorerConfig,
    DriveExplorerEvents,
    DriveExplorerSelection,
} from './types';
import { useArrowKeyNavigation } from './useArrowKeyNavigation';
import { useItemVisibility } from './useItemVisibility';
import { useListVirtualizer } from './useListVirtualizer';

interface DriveExplorerBodyProps {
    cells: CellDefinition[];
    itemIds: string[];
    containerRef: RefObject<HTMLDivElement>;
    config?: DriveExplorerConfig;
    events?: DriveExplorerEvents;
    conditions: DriveExplorerConditions;
    loading?: boolean;
    selection: DriveExplorerSelection;
    getDragMoveControls?: (uid: string) => DragMoveControls;
    isMultiSelectionDisabled?: boolean;
    showCheckboxColumn?: boolean;
    hideSelectionHighlight?: boolean;
    contextMenuControls?: ContextMenuControls;
    a11y: DriveExplorerA11y;
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
    getDragMoveControls,
    isMultiSelectionDisabled,
    showCheckboxColumn = true,
    hideSelectionHighlight = false,
    contextMenuControls,
    a11y,
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

    // Pixel distance between two consecutive rows' top edges. Used by the arrow-key
    // hook to compute scrollTop directly when the target row is outside the
    // virtualizer's window (no DOM node to scrollIntoView - we scroll first, then
    // refocus on the next frame once the virtualizer renders the row).
    const rowHeightWithGap = (config?.itemHeight ?? defaultConfig.itemHeight) + (config?.gap ?? defaultConfig.gap);
    useArrowKeyNavigation({
        containerRef,
        itemIds,
        itemsPerRow: 1,
        rowHeightWithGap,
    });

    return (
        <div ref={containerRef} className="flex-1 overflow-auto" data-testid="drive-explorer-scroll">
            {itemCount > 0 && (
                <div
                    className="w-full relative h-custom"
                    style={{
                        '--h-custom': `${virtualizer.getTotalSize()}px`,
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
                            '--h-custom': `${virtualizer.getTotalSize()}px`,
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
                                        getDragMoveControls={getDragMoveControls}
                                        isMultiSelectionDisabled={isMultiSelectionDisabled}
                                        showCheckboxColumn={showCheckboxColumn}
                                        hideSelectionHighlight={hideSelectionHighlight}
                                        contextMenuControls={contextMenuControls}
                                        a11y={a11y}
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
