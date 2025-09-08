import { type DragEventHandler, useRef, useState } from 'react';

import { DRAG_ITEM_KEY } from '@proton/components/containers/items/constants';

interface UseCategoriesDragProps {
    onDrop: (categoryId: string, itemIds: string[]) => void;
}

export const useCategoriesDrag = ({ onDrop }: UseCategoriesDragProps) => {
    const isDragging = useRef<boolean>(false);
    const [draggedOverCategoryId, setDraggedOverCategoryId] = useState<string | undefined>();

    const handleDragOver: (categoryId: string) => DragEventHandler<HTMLDivElement> = (categoryId) => (event) => {
        if (!isDragging.current) {
            return;
        }

        event.preventDefault();
        setDraggedOverCategoryId(categoryId);
    };

    const handleDragEnter: DragEventHandler<HTMLDivElement> = (event) => {
        event.preventDefault();
        isDragging.current = true;
    };

    const handleDragLeave: DragEventHandler<HTMLDivElement> = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDraggedOverCategoryId(undefined);
        }
    };

    const handleDrop: (categoryId: string) => DragEventHandler<HTMLDivElement> = (categoryId) => (event) => {
        event.preventDefault();
        isDragging.current = false;
        setDraggedOverCategoryId(undefined);

        const draggedData = event.dataTransfer.getData(DRAG_ITEM_KEY);
        if (!draggedData) {
            return;
        }

        let draggedItemIds: string[];
        try {
            draggedItemIds = JSON.parse(draggedData);
        } catch {
            return;
        }

        onDrop(categoryId, draggedItemIds);
    };

    const handleDragEnd: DragEventHandler<HTMLDivElement> = () => {
        isDragging.current = false;
        setDraggedOverCategoryId(undefined);
    };

    return {
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        handleDrop,
        handleDragEnd,
        draggedOverCategoryId,
    };
};
