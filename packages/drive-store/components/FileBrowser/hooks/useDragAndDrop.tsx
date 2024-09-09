import type { DragEvent } from 'react';
import { useCallback } from 'react';

import { useDragMove } from '@proton/components';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';
import noop from '@proton/utils/noop';

import type { DecryptedLink } from '../../../store';
import { getMovedFiles } from '../../../utils/moveTexts';
import { selectMessageForItemList } from '../../sections/helpers';
import type { DragMoveControls, FileBrowserBaseItem } from '../interface';
import { useSelection } from '../state/useSelection';

interface Options {
    item: FileBrowserBaseItem;

    dragMoveControls?: DragMoveControls;
}

function useDragAndDrop({ item, dragMoveControls }: Options) {
    const selectionControls = useSelection();
    // Timer for click and double click detection.
    const dragMove = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: CUSTOM_DATA_FORMAT,
        formatter: JSON.stringify,
    });
    const isDraggingSelected = dragMoveControls?.selectedItems.some(({ id }) => id === item.id);
    const dragMoveItems = isDraggingSelected ? dragMoveControls!.selectedItems : [item];
    const movingCount = dragMoveItems.length;

    const texts = getMovedFiles(movingCount);

    const moveText = selectMessageForItemList(
        dragMoveItems.map((item) => (item as unknown as DecryptedLink).isFile),
        texts
    );

    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) =>
        item.isLocked || item.isInvitation ? undefined : fn;

    const handleDragStart = unlessDisabled(
        useCallback(
            (e: DragEvent<HTMLTableRowElement>) => {
                if (!isDraggingSelected) {
                    selectionControls?.selectItem(item.id);
                }
                dragMove.handleDragStart(e);
            },
            [isDraggingSelected, dragMove.handleDragStart, selectionControls?.selectItem]
        )
    );

    const handleDragEnd = useCallback(
        (e: DragEvent<HTMLTableRowElement>) => {
            e.currentTarget.blur();
            dragMove.handleDragEnd();
        },
        [dragMove.handleDragEnd]
    );

    const draggable = dragMoveControls && !item.isLocked && !item.isInvitation;

    return {
        dragMoveItems,
        dragMove,
        draggable,
        itemHandlers: {
            onDragEnd: handleDragEnd,
            onDragEnter: unlessDisabled(dragMoveControls?.handleDragEnter),
            onDragLeave: unlessDisabled(dragMoveControls?.handleDragLeave),
            onDragOver: unlessDisabled(dragMoveControls?.handleDragOver),
            onDragStart: handleDragStart,
            onDrop: unlessDisabled(dragMoveControls?.handleDrop),
        },
        moveText,
    };
}

export default useDragAndDrop;
