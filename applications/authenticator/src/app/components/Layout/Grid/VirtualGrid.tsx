import { type ReactNode, useCallback, useMemo } from 'react';

import { AutoScroller, PointerActivationConstraints } from '@dnd-kit/dom';
import { DragDropProvider, DragOverlay, KeyboardSensor, PointerSensor } from '@dnd-kit/react';

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
    const { order, active, onDragStart, onDragEnd, onDragOver } = useGridSort(items, onItemsReorder);
    const autoscroll = useVirtualGridAutoscroll(active, config.container, virtualizer);

    /** Track whether the currently dragged item is rendered by the virtualizer.
     * During drag operations, if the user scrolls far enough that the active item
     * falls outside the virtualizer's overscan boundary, it gets unmounted.
     * This breaks drag-and-drop visual feedback since the dragged item disappears */
    let activeRendered = false;

    return (
        <DragDropProvider
            sensors={[
                PointerSensor.configure({
                    activationConstraints: [new PointerActivationConstraints.Distance({ value: 8 })],
                    preventActivation: () => {
                        // Default behaviour disables dnd when clicking on an interactive element (eg button)
                        // We disable it because root element in GridItem is a button
                        // https://github.com/clauderic/dnd-kit/blob/main/packages/dom/src/core/sensors/pointer/PointerSensor.ts#L81
                        return false;
                    },
                }),
                KeyboardSensor,
            ]}
            plugins={(defaults) => [...defaults.filter((plugin) => plugin !== AutoScroller)]}
            onDragStart={onDragStart}
            onDragEnd={pipe(onDragEnd, autoscroll.cleanup)}
            onDragOver={onDragOver}
        >
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
                                index={virtualItem.index}
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
                                    index={index}
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
            <DragOverlay>
                {(source) =>
                    active &&
                    itemsMap[active] && (
                        <div
                            style={{
                                width: config.itemWidth,
                                height: config.itemHeight,
                                cursor: 'grabbing',
                                opacity: 1,
                            }}
                        >
                            {renderGridItem(itemsMap[source.id])}
                        </div>
                    )
                }
            </DragOverlay>
        </DragDropProvider>
    );
};
