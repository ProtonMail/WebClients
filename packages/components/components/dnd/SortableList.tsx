import type { ReactNode } from 'react';

import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const SortableList = ({
    onSortEnd,
    children,
    items,
}: {
    onSortEnd?: (event: { oldIndex: number; newIndex: number }) => void;
    onActiveId?: (id: string | null) => void;
    children: ReactNode;
    items: string[];
}) => {
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (typeof active.id === 'string' && typeof over?.id === 'string' && active.id !== over.id) {
            onSortEnd?.({ oldIndex: items.indexOf(active.id), newIndex: items.indexOf(over.id) });
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {children}
            </SortableContext>
        </DndContext>
    );
};
