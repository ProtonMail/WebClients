import { useEffect } from 'react';
import * as React from 'react';

import { classnames, DragMoveContainer } from '@proton/components';

import useFileBrowserItem from '../hooks/useFileBrowserItem';
import useDragAndDrop from '../hooks/useDragAndDrop';
import { DragMoveControls, FileBrowserBaseItem } from '../interface';

export interface ItemProps<T extends FileBrowserBaseItem> {
    className?: string;
    GridViewItem: React.FC<{ item: T }>;
    item: T;
    style?: React.CSSProperties;

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
        <div className={classnames(['flex flex-col opacity-on-hover-container', className])} style={style}>
            {draggable && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{dragnDropControls.moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <div
                role="button"
                tabIndex={0}
                draggable={draggable}
                className={classnames([
                    'file-browser-grid-item m0-5 flex flex-column w100 rounded border text-align-left',
                    isSelected && 'border-primary',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.isLocked) &&
                        'file-browser-grid-item--highlight',
                    (dragging || item.isLocked) && 'opacity-50',
                ])}
                aria-disabled={item.isLocked}
                {...itemHandlers}
                {...dragnDropControls.itemHandlers}
            >
                <GridViewItem item={item} />
            </div>
        </div>
    );
};

export default ItemCell;
