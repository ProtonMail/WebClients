import type { DragEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import generateUID from '@proton/utils/generateUID';

import useHandler from '../../hooks/useHandler';
import { DRAG_ITEM_ID_KEY, DRAG_ITEM_KEY } from './constants';

import './items.scss';

type AbstractItem = { ID?: string };

/**
 * Implement the draggable logic for an item
 * Linked to the selection logic to drag the currently selected elements
 * or to restore the selection after the drag
 * Also take care of rendering the drag element and including the needed data in the transfer
 * Items can be any object containing an ID
 * @param items List of all items in the list
 * @param checkedIDs List of the currently checked IDs
 * @param onCheck Check handler to update selection
 * @param getDragHtml Callback to return HTML content of the drag element
 * @param selectAll Use select all feature so that we know how many items to drag
 * @returns Currently dragged ids and drag handler to pass to items
 */
const useItemsDraggable = <Item extends AbstractItem>(
    items: Item[],
    checkedIDs: string[],
    onCheck: (IDs: string[], checked: boolean, replace: boolean) => void,
    getDragHtml: (draggedIDs: string[]) => string,
    selectAll?: boolean
) => {
    // HTML reference to the drag element
    const dragElementRef = useRef<HTMLDivElement>();

    // List of currently dragged item ids
    const [draggedIDs, setDraggedIDs] = useState<string[]>([]);

    // Saved selection when dragging an item not selected
    const [savedCheck, setSavedCheck] = useState<string[]>();

    useEffect(() => {
        setDraggedIDs([]);
    }, [items]);

    const clearDragElement = () => {
        if (dragElementRef.current) {
            document.body.removeChild(dragElementRef.current);
            dragElementRef.current = undefined;
        }
    };

    const handleDragCanceled = useHandler(() => {
        setDraggedIDs([]);

        if (savedCheck) {
            onCheck(savedCheck, true, true);
            setSavedCheck(undefined);
        }
    });

    /**
     * Drag end handler to use on the draggable element
     */
    const handleDragEnd = useCallback((event: DragEvent) => {
        // Always clear the drag element no matter why the drag has ended
        clearDragElement();

        // We discover that Chrome initialize the dropEffect to 'copy' and only set it to 'none' just after
        // We don't use 'copy' at all so both 'none' and 'copy' effects can be considered as canceled drags
        if (event.dataTransfer.dropEffect === 'none' || event.dataTransfer.dropEffect === 'copy') {
            return handleDragCanceled();
        }
    }, []);

    const handleDragSucceed = useHandler((action: string | undefined) => {
        clearDragElement();

        setDraggedIDs([]);

        if (savedCheck) {
            if (action === 'link') {
                // Labels
                onCheck(savedCheck, true, true);
            }
            setSavedCheck(undefined);
        }
    });

    /**
     * Drag start handler to use on the draggable element
     */
    const handleDragStart = useCallback(
        (event: DragEvent, item: Item) => {
            clearDragElement();

            const ID = item.ID || '';
            const dragInSelection = checkedIDs.includes(ID);
            const selection = dragInSelection ? checkedIDs : [ID];

            setDraggedIDs(selection);
            setSavedCheck(checkedIDs);

            if (!dragInSelection) {
                onCheck([], true, true);
            }

            const dragElement = document.createElement('div');
            dragElement.innerHTML = getDragHtml(selection);
            dragElement.className = 'drag-element p-4 border rounded';
            dragElement.style.insetInlineStart = '-9999px';
            dragElement.id = generateUID(DRAG_ITEM_ID_KEY);
            // Wiring the dragend event on the drag element because the one from drag start is not reliable
            dragElement.addEventListener('dragend', (event) => handleDragSucceed(event.dataTransfer?.dropEffect));
            document.body.appendChild(dragElement);
            event.dataTransfer.setDragImage(dragElement, 0, 0);
            event.dataTransfer.setData(DRAG_ITEM_KEY, JSON.stringify(selection));
            event.dataTransfer.setData(DRAG_ITEM_ID_KEY, dragElement.id);

            dragElementRef.current = dragElement;
        },
        [checkedIDs, onCheck, selectAll]
    );

    return { draggedIDs, handleDragStart, handleDragEnd };
};

export default useItemsDraggable;
