import { useEffect } from 'react';
import * as React from 'react';

import { DragMoveContainer } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useDragAndDrop from '../hooks/useDragAndDrop';
import useFileBrowserItem from '../hooks/useFileBrowserItem';
import type { DragMoveControls, FileBrowserBaseItem } from '../interface';

export interface ItemProps<T extends FileBrowserBaseItem> {
    className?: string;
    GridViewItem: React.FC<{ item: T }>;
    item: T;
    style?: React.CSSProperties;

    isMultiSelectionDisabled?: boolean;

    onItemContextMenu?: (e: any) => void;
    onItemOpen?: (id: string) => void;
    onItemRender?: (item: any) => void;

    dragMoveControls?: DragMoveControls;
}

const ItemCell = <T extends FileBrowserBaseItem>({
    className,
    style,
    item,

    GridViewItem,

    isMultiSelectionDisabled,

    onItemContextMenu,
    onItemOpen,
    onItemRender,
    dragMoveControls,
}: ItemProps<T>) => {
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
        <div className={clsx(['flex group-hover-opacity-container', className])} style={style}>
            {draggable && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{dragnDropControls.moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <div
                role="button"
                tabIndex={0}
                draggable={draggable}
                className={clsx([
                    'file-browser-grid-item m-2 flex flex-column w-full rounded border text-align-left',
                    isSelected && 'border-primary',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.isLocked) &&
                        'file-browser-grid-item--highlight',
                    (dragging || item.isLocked) && 'opacity-50',
                ])}
                aria-disabled={item.isLocked}
                data-testid="grid-item"
                {...itemHandlers}
                {...dragnDropControls.itemHandlers}
            >
                <GridViewItem item={item} />
            </div>
        </div>
    );
};

export default ItemCell;
