import { type ReactNode, useCallback } from 'react';

import type { RefObjectReact18Compat } from '@proton/atoms/helpers/RefObjectReact18Compat';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
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
import { type ScrollToRowAlign, useArrowKeyNavigation } from './useArrowKeyNavigation';
import { useItemVisibility } from './useItemVisibility';
import { useListVirtualizer } from './useListVirtualizer';

interface DriveExplorerBodyProps {
    cells: CellDefinition[];
    itemIds: string[];
    containerRef: RefObjectReact18Compat<HTMLDivElement>;
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
    footer?: ReactNode;
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
    footer,
}: DriveExplorerBodyProps) => {
    const itemCount = loading ? itemIds.length + 1 : itemIds.length;

    const itemHeightRem = config?.itemHeightRem ?? defaultConfig.itemHeightRem;
    const virtualizer = useListVirtualizer(
        {
            itemHeightRem,
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

    const scrollToRow = useCallback(
        (rowIndex: number, align: ScrollToRowAlign) => virtualizer.scrollToIndex(rowIndex, { align }),
        [virtualizer]
    );
    useArrowKeyNavigation({
        containerRef,
        itemIds,
        itemsPerRow: 1,
        scrollToRow,
    });

    return (
        <div className="flex flex-column flex-1 overflow-hidden">
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
                                            minItemHeightRem={itemHeightRem}
                                            itemId={itemId}
                                            cells={cells}
                                            loading={loading}
                                            totalItemCount={itemIds.length}
                                            conditions={conditions}
                                            selection={selection}
                                            events={events}
                                            onObserve={observeElement}
                                            measureElement={virtualizer.measureElement}
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
                {footer}
            </div>
        </div>
    );
};
