import { DragEvent } from 'react';
import { useDragOver } from '../../hooks';
import { DRAG_ITEM_KEY, DRAG_ITEM_ID_KEY } from './constants';

/**
 * Implement the logic of receiving the drop of items from the item list
 * Prepare all drag handlers for receiving zones and parse events to get items ids
 * @param dragFilter Filter to accept or not drop on this zone
 * @param dropEffect Drop effect type to use
 * @param dropCallback Drop callback to run when a drop event occurs with parsed items ids
 * @returns All drag handler to use
 */
const useItemsDroppable = (
    dragFilter: (event: DragEvent) => boolean,
    dropEffect: 'none' | 'copy' | 'link' | 'move' = 'move',
    dropCallback: (itemIDs: string[]) => void | Promise<void>
) => {
    const [dragOver, dragProps] = useDragOver(
        (event: DragEvent) => event.dataTransfer.types.includes(DRAG_ITEM_KEY) && dragFilter(event),
        dropEffect
    );

    const handleDrop = async (event: DragEvent) => {
        dragProps.onDrop(event);

        // Manual trigger of the dragend event on the drag element because native event is not reliable
        const dragElement = document.getElementById(event.dataTransfer.getData(DRAG_ITEM_ID_KEY));
        const dragendEvent = new Event('dragend') as any;
        dragendEvent.dataTransfer = event.dataTransfer;
        dragendEvent.dataTransfer.dropEffect = dropEffect; // Chrome is losing the original dropEffect
        dragElement?.dispatchEvent(dragendEvent);

        const itemIDs = JSON.parse(event.dataTransfer.getData(DRAG_ITEM_KEY)) as string[];
        void dropCallback(itemIDs);
    };

    return { dragOver, dragProps, handleDrop };
};

export default useItemsDroppable;
