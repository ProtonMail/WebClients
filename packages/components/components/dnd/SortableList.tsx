import type { ReactNode, RefObject } from 'react';

import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers';
import { RestrictToElement } from '@dnd-kit/dom/modifiers';
import { DragDropProvider, type DragEndEvent, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { isSortable } from '@dnd-kit/react/sortable';

export const SortableList = ({
    onSortEnd,
    children,
    containerRef,
}: {
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
    onActiveId?: (id: string | null) => void;
    children: ReactNode;
    containerRef?: RefObject<HTMLElement>;
}) => {
    const handleDragEnd: DragEndEvent = (event) => {
        const { operation } = event;
        const { source } = operation;
        if (isSortable(source)) {
            const oldIndex = source.initialIndex;
            const newIndex = source.index;
            // If new index doesn't exist (maybe it's a disabled item)
            if (newIndex === -1 || oldIndex === newIndex) {
                return;
            }
            onSortEnd?.({ oldIndex, newIndex });
        }
    };

    return (
        <DragDropProvider
            onDragEnd={handleDragEnd}
            sensors={[PointerSensor, KeyboardSensor]}
            modifiers={(defaults) => [
                ...defaults,
                RestrictToVerticalAxis,
                ...(containerRef ? [RestrictToElement.configure({ element: () => containerRef.current })] : []),
            ]}
        >
            {children}
        </DragDropProvider>
    );
};
