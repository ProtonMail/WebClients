import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useDragMove } from '@proton/components';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';
import noop from '@proton/utils/noop';

import { DecryptedLink } from '../../../store';
import { selectMessageForItemList } from '../../sections/helpers';
import { DragMoveControls, FileBrowserBaseItem } from '../interface';
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

    const texts = {
        allFiles: c('Notification').ngettext(msgid`Move ${movingCount} file`, `Move ${movingCount} files`, movingCount),
        allFolders: c('Notification').ngettext(
            msgid`Move ${movingCount} folder`,
            `Move ${movingCount} folders`,
            movingCount
        ),
        mixed: c('Notification').ngettext(msgid`Move ${movingCount} item`, `Move ${movingCount} items`, movingCount),
    };

    const moveText = selectMessageForItemList(
        dragMoveItems.map((item) => (item as unknown as DecryptedLink).isFile),
        texts
    );

    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) => (item.isLocked ? undefined : fn);

    const handleDragStart = unlessDisabled(
        useCallback(
            (e: React.DragEvent<HTMLTableRowElement>) => {
                if (!isDraggingSelected) {
                    selectionControls?.selectItem(item.id);
                }
                dragMove.handleDragStart(e);
            },
            [isDraggingSelected, dragMove.handleDragStart, selectionControls?.selectItem]
        )
    );

    const handleDragEnd = useCallback(
        (e) => {
            e.currentTarget.blur();
            dragMove.handleDragEnd();
        },
        [dragMove.handleDragEnd]
    );

    const draggable = dragMoveControls && !item.isLocked;

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
