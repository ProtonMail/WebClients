import { useState, DragEventHandler, DragEvent } from 'react';

/**
 * Hooks to manage a dragOver flag
 * Takes an optional filter function to accept only specific drag content
 * Returns the flag and the handlers to pass to the element you want to drag on
 */
export const useDragOver = (
    dragFilter: (event: DragEvent) => boolean = () => true,
    dropEffect = 'move'
): [
    boolean,
    {
        onDragEnter: DragEventHandler;
        onDragLeave: DragEventHandler;
        onDragOver: DragEventHandler;
        onDrop: () => void;
    }
] => {
    const [dragOver, setDragOver] = useState(0);

    const handleDragEnter = (event: DragEvent) => {
        if (dragFilter(event)) {
            event.preventDefault();
            setDragOver(dragOver + 1);
        }
    };
    const handleDragLeave = (event: DragEvent) => {
        if (dragFilter(event)) {
            event.preventDefault();
            setDragOver(dragOver - 1);
        }
    };
    const handleDragOver = (event: DragEvent) => {
        if (dragFilter(event)) {
            event.dataTransfer.dropEffect = dropEffect;
            event.preventDefault();
        }
    };

    const handleDrop = () => {
        setDragOver(0);
    };

    return [
        dragOver > 0,
        { onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop }
    ];
};
