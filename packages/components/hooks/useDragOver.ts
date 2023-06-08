import { DragEvent, DragEventHandler, useState } from 'react';

interface Options {
    onDragOver?: (event: DragEvent) => void;
    onDragEnter?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
}

type DragOverReturn = [
    dragsOver: boolean,
    dragHandlers: {
        onDragEnter: DragEventHandler;
        onDragLeave: DragEventHandler;
        onDragOver: DragEventHandler;
        onDrop: DragEventHandler;
    }
];

/**
 * Hooks to manage a dragOver flag
 * Takes an optional filter function to accept only specific drag content
 * Returns the flag and the handlers to pass to the element you want to drag on
 */
const useDragOver = (
    dragFilter: (event: DragEvent) => boolean = () => true,
    dropEffect: 'none' | 'copy' | 'link' | 'move' = 'move',
    { onDragOver, onDragEnter, onDragLeave, onDrop }: Options = {}
): DragOverReturn => {
    const [dragOver, setDragOver] = useState(0);

    const handleDragEnter = (event: DragEvent) => {
        if (dragFilter(event)) {
            event.preventDefault();
            if (dragOver === 0) {
                onDragEnter?.(event);
            }
            setDragOver(dragOver + 1);
        }
    };
    const handleDragLeave = (event: DragEvent) => {
        if (dragFilter(event)) {
            event.preventDefault();
            if (dragOver === 1) {
                onDragLeave?.(event);
            }
            setDragOver(dragOver - 1);
        }
    };
    const handleDragOver = (event: DragEvent) => {
        if (dragFilter(event)) {
            if (event.dataTransfer.effectAllowed === 'all') {
                event.dataTransfer.dropEffect = dropEffect;
            }
            event.preventDefault();
            onDragOver?.(event);
        }
    };

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        setDragOver(0);
        onDrop?.(event);
    };

    return [
        dragOver > 0,
        { onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop },
    ];
};

export default useDragOver;
