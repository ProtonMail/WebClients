import { DragEvent, DragEventHandler } from 'react';

export const isDragFile = (event: DragEvent) => event.dataTransfer?.types.includes('Files');

export const onlyDragFiles = (eventHandler: DragEventHandler) => (event: DragEvent) => {
    if (isDragFile(event)) {
        return eventHandler(event);
    }
};
