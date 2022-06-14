import { memo, useEffect } from 'react';

import {
    TableRow,
    classnames,
    DragMoveContainer,
} from '@proton/components';
import { isEquivalent } from '@proton/shared/lib/helpers/object';
import { shallowEqual } from '@proton/utils/array';

import { DragMoveControls, FileBrowserBaseItem } from '../interface';
import useFileBrowserItem from '../hooks/useFileBrowserItem';
import useDragAndDrop from '../hooks/useDragAndDrop';

export interface ListItemProps<T extends FileBrowserBaseItem> {
    Cells: React.FC<{ item: any }>[];
    item: T;
    style?: React.CSSProperties;

    onItemContextMenu?: (e: any) => void;
    onItemOpen?: (id: string) => void;
    onItemRender?: (item: any) => void;

    dragMoveControls?: DragMoveControls;
}

const ItemRow = <T extends FileBrowserBaseItem>({
    style,
    item,
    Cells,

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
    });
    const dragnDropControls = useDragAndDrop({
        item,
        dragMoveControls,
    });

    const { draggable, dragMoveItems } = dragnDropControls;
    const { dragging, DragMoveContent } = dragnDropControls.dragMove;

    useEffect(() => {
        onItemRender?.(item);
    }, []);

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
                className={classnames([
                    'file-browser-list-item flex user-select-none opacity-on-hover-container',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.isLocked) && 'bg-strong',
                    (dragging || item.isLocked) && 'opacity-50',
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
