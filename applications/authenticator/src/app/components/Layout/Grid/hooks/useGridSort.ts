import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

import type { IdentifiableItem } from './useGridVirtualizer';

/** Returns whether re-ordering is allowed. Return `false` to
 * prevent the reorder and rollback to original position. */
export type OnGridReorder<T> = (itemId: T, options: { before?: T; after?: T; first?: T; last?: T }) => boolean;

const intoIds = <T extends IdentifiableItem>(items: T[]) => items.map((item) => item.id);

export const useGridSort = <T extends IdentifiableItem>(items: T[], onReorder: OnGridReorder<string>) => {
    const base = useMemo(() => intoIds(items), [items]);

    const [order, setOrder] = useState<string[]>(base);
    const [active, setActive] = useState<string | null>(null);

    const onDragStart = useCallback((event: DragStartEvent) => {
        setActive(event.active.id.toString());
    }, []);

    const onDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active: dragActive, over } = event;

            if (over && dragActive.id !== over?.id) {
                setOrder((prev) => {
                    const oldIndex = prev.indexOf(dragActive.id.toString());
                    const newIndex = prev.indexOf(over.id.toString());

                    const result = arrayMove(prev, oldIndex, newIndex);
                    const before = newIndex > 0 ? result[newIndex - 1] : undefined;
                    const after = newIndex < result.length - 1 ? result[newIndex + 1] : undefined;
                    const first = prev[0];
                    const last = prev[prev.length - 1];

                    return onReorder(dragActive.id.toString(), { before, after, first, last }) ? result : prev;
                });
            }

            setActive(null);
        },
        [onReorder]
    );

    useEffect(() => {
        setOrder(base);
        /** Active state should be reset if the next `itemIds`
         * does not include the current active ID */
        setActive((current) => (current && !base.includes(current) ? null : current));
    }, [base]);

    return useMemo(() => ({ order, active, onDragStart, onDragEnd }), [order, active, onDragEnd]);
};
