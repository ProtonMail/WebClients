import { memo, useEffect } from 'react';

import { DragMoveContainer, TableRow } from '@proton/components';
import { isEquivalent } from '@proton/shared/lib/helpers/object';
import clsx from '@proton/utils/clsx';
import shallowEqual from '@proton/utils/shallowEqual';

import useDragAndDrop from '../hooks/useDragAndDrop';
import useFileBrowserItem from '../hooks/useFileBrowserItem';
import type { DragMoveControls, FileBrowserBaseItem } from '../interface';

export interface ListItemProps<T extends FileBrowserBaseItem> {
    Cells: React.FC<{ item: any }>[];
    item: T;
    style?: React.CSSProperties;

    isMultiSelectionDisabled?: boolean;

    onItemContextMenu?: (e: any) => void;
    onItemOpen?: (id: string) => void;
    onItemRender?: (item: any) => void;

    dragMoveControls?: DragMoveControls;
}

const ItemRow = <T extends FileBrowserBaseItem>({
    style,
    item,
    Cells,

    isMultiSelectionDisabled,

    onItemContextMenu,
    onItemOpen,
    onItemRender,
    dragMoveControls,
}: ListItemProps<T>) => {
    const { isSelected, itemHandlers } = useFileBrowserItem({
        id: item.id,
        isItemLocked: item.isLocked,
        onItemOpen,
        onItemContextMenu: onItemContextMenu,
        isMultiSelectionDisabled,
    });
    const dragnDropControls = useDragAndDrop({
        item,
        dragMoveControls,
    });

    const { draggable, dragMoveItems } = dragnDropControls;
    const { dragging, DragMoveContent } = dragnDropControls.dragMove;

    useEffect(() => {
        onItemRender?.(item);
    }, [onItemRender]);

    return (
        <>
            {draggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{dragnDropControls.moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                style={{ ...style, ...item.itemRowStyle }}
                tabIndex={0}
                role="button"
                draggable={draggable}
                className={clsx([
                    'file-browser-list-item flex user-select-none group-hover-opacity-container',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.isLocked) && 'bg-strong',
                    (dragging || item.isLocked) && 'opacity-50',
                    item.isInvitation && 'file-browser-list-item--invitation',
                ])}
                aria-disabled={item.isLocked}
                {...itemHandlers}
                {...dragnDropControls.itemHandlers}
            >
                {Cells.map((Cell, index) => (
                    <Cell key={item.id + index} item={item} />
                ))}
            </TableRow>
        </>
    );
};

export default memo(ItemRow, (a, b) => {
    if (isEquivalent(a, b)) {
        return true;
    }

    if (
        !isEquivalent(a.style || {}, b.style || {}) ||
        !isEquivalent(a.item, b.item) ||
        !shallowEqual(a.Cells, b.Cells)
    ) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget &&
        a.dragMoveControls?.selectedItems === b.dragMoveControls?.selectedItems;

    return dragControlsEqual;
});
