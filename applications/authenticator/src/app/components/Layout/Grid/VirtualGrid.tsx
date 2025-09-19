import { type ReactNode, useCallback, useMemo } from 'react';

import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { pipe } from '@proton/pass/utils/fp/pipe';
import { toMap } from '@proton/shared/lib/helpers/object';

import { VirtualGridItem } from './VirtualGridItem';
import type { GridDefinition } from './hooks/useGridConfig';
import { type OnGridReorder, useGridSort } from './hooks/useGridSort';
import { type IdentifiableItem, useGridVirtualizer } from './hooks/useGridVirtualizer';
import { useVirtualGridAutoscroll } from './hooks/useVirtualGridAutoscroll';

type Props<T extends IdentifiableItem> = {
    definition: GridDefinition;
    items: T[];
    className: string;
    disabled: boolean;
    renderGridItem: (item: T) => ReactNode;
    onReorder: OnGridReorder<T>;
};

export const VirtualGrid = <T extends IdentifiableItem>({
    className,
    definition,
    items,
    disabled = true,
    renderGridItem,
    onReorder,
}: Props<T>) => {
    const itemsMap = useMemo<Record<string, T>>(() => toMap(items, 'id'), [items]);

    const onItemsReorder = useCallback<OnGridReorder<string>>(
        (itemId, options) => {
            const item = itemsMap[itemId];
            const before = options.before ? itemsMap[options.before] : undefined;
            const after = options.after ? itemsMap[options.after] : undefined;
            const first = options.first ? itemsMap[options.first] : undefined;
            const last = options.last ? itemsMap[options.last] : undefined;
            return item ? onReorder(item, { before, after, first, last }) : false;
        },
        [onReorder, itemsMap]
    );

    const { config, virtualizer } = useGridVirtualizer(definition, items);
    const { order, active, onDragStart, onDragEnd } = useGridSort(items, onItemsReorder);
    const autoscroll = useVirtualGridAutoscroll(active, config.container, virtualizer);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    /** Track whether the currently dragged item is rendered by the virtualizer.
     * During drag operations, if the user scrolls far enough that the active item
     * falls outside the virtualizer's overscan boundary, it gets unmounted.
     * This breaks drag-and-drop visual feedback since the dragged item disappears */
    let activeRendered = false;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={pipe(onDragEnd, autoscroll.cleanup)}
            autoScroll={false}
        >
            <SortableContext items={order} strategy={rectSortingStrategy}>
                <div className={className} ref={config.container}>
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualItem) => {
                            const id = order[virtualItem.index];
                            const item = id ? itemsMap[id] : null;
                            if (!item) return null;

                            activeRendered = activeRendered || item.id === active;

                            return (
                                <VirtualGridItem
                                    id={item.id}
                                    key={item.id}
                                    virtualItem={virtualItem}
                                    config={config}
                                    disabled={disabled}
                                >
                                    {renderGridItem(item)}
                                </VirtualGridItem>
                            );
                        })}
                        {active &&
                            !activeRendered &&
                            (() => {
                                /* Fallback render for dragged items that have been virtualized away.
                                 * When the active item is not in the current virtual window, we manually
                                 * render it at its calculated position to maintain visual continuity. */
                                const item = itemsMap[active];
                                if (!item) return null;

                                const index = order.indexOf(active);
                                const row = Math.floor(index / config.columns);
                                const lane = index % config.columns;
                                const start = row * (config.itemHeight + config.gap);

                                return (
                                    <VirtualGridItem
                                        id={item.id}
                                        key={item.id}
                                        virtualItem={{ start, lane }}
                                        config={config}
                                    >
                                        {renderGridItem(item)}
                                    </VirtualGridItem>
                                );
                            })()}
                    </div>
                </div>
            </SortableContext>
            <DragOverlay>
                {active && itemsMap[active] && (
                    <div
                        style={{
                            width: config.itemWidth,
                            height: config.itemHeight,
                            cursor: 'grabbing',
                            opacity: 1,
                        }}
                    >
                        {renderGridItem(itemsMap[active])}
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};
