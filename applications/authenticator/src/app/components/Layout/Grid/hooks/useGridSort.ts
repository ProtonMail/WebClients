import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { arrayMove } from '@dnd-kit/helpers';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/react';

import type { IdentifiableItem } from './useGridVirtualizer';

/** Returns whether re-ordering is allowed. Return `false` to
 * prevent the reorder and rollback to original position. */
export type OnGridReorder<T> = (itemId: T, options: { before?: T; after?: T; first?: T; last?: T }) => boolean;

const intoIds = <T extends IdentifiableItem>(items: T[]) => items.map((item) => item.id);

export const useGridSort = <T extends IdentifiableItem>(items: T[], onReorder: OnGridReorder<string>) => {
    const base = useMemo(() => intoIds(items), [items]);

    // We store the original order in a ref to rollback to it if
    // the reorder is canceled or failed.
    const snapshot = useRef<string[]>([]);
    const [order, setOrder] = useState<string[]>(base);
    const [active, setActive] = useState<string | null>(null);

    const onDragStart = useCallback<DragStartEvent>(
        (event) => {
            const { source } = event.operation;
            snapshot.current = order;
            setActive(source?.id?.toString() ?? null);
        },
        [order]
    );

    const onDragEnd = useCallback<DragEndEvent>(
        (event) => {
            if (event.canceled) {
                setOrder(snapshot.current);
                setActive(null);
                return;
            }

            const { source } = event.operation;
            if (source) {
                setOrder((prev) => {
                    const newIndex = prev.indexOf(source.id.toString());
                    const before = newIndex > 0 ? prev[newIndex - 1] : undefined;
                    const after = newIndex < prev.length - 1 ? prev[newIndex + 1] : undefined;
                    const first = prev[0];
                    const last = prev[prev.length - 1];
                    return onReorder(source.id.toString(), { before, after, first, last }) ? prev : snapshot.current;
                });
            }

            setActive(null);
        },
        [onReorder]
    );

    const onDragOver = useCallback<DragOverEvent>((event) => {
        // Disable default reordering by OptimisticSortingPlugin,
        // manual sorting is handled below.
        event.preventDefault();
        const { source, target } = event.operation;

        if (!source || !target || source.id === target.id) return;
        setOrder((prev) => {
            const oldIndex = prev.indexOf(source.id.toString());
            const newIndex = prev.indexOf(target.id.toString());
            if (oldIndex === -1 || newIndex === -1) return prev;
            return arrayMove(prev, oldIndex, newIndex);
        });
    }, []);

    useEffect(() => {
        setOrder(base);
        /** Active state should be reset if the next `itemIds`
         * does not include the current active ID */
        setActive((current) => (current && !base.includes(current) ? null : current));
    }, [base]);

    return useMemo(() => ({ order, active, onDragStart, onDragEnd, onDragOver }), [order, active, onDragEnd]);
};
