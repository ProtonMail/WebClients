import React from 'react';
import { FileIcon, Checkbox, classnames, DragMoveContainer } from 'react-components';
import { LinkType } from '../../../interfaces/link';
import { ItemProps } from '../interfaces';
import ItemContextMenu from '../ItemContextMenu';
import SharedURLIcon from '../SharedURLIcon';
import useFileBrowserItem from '../useFileBrowserItem';

export interface Props extends Omit<ItemProps, 'isPreview' | 'showLocation' | 'columns'> {
    style: React.CSSProperties;
    className?: string;
}

function ItemCell({
    shareId,
    style,
    className,
    item,
    selectedItems,
    onToggleSelect,
    onClick,
    onShiftClick,
    selectItem,
    dragMoveControls,
    secondaryActionActive,
}: Props) {
    const {
        dragMove: { DragMoveContent, dragging },
        dragMoveItems,
        moveText,
        iconText,
        isSelected,
        contextMenu,
        contextMenuPosition,
        draggable,
        itemHandlers,
        checkboxHandlers,
        checkboxWrapperHandlers,
    } = useFileBrowserItem<HTMLDivElement>({
        item,
        onToggleSelect,
        selectItem,
        selectedItems,
        dragMoveControls,
        onClick,
        onShiftClick,
    });

    return (
        <div className={classnames(['flex flex-col', className])} style={style}>
            {draggable && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            {!item.Disabled && (
                <ItemContextMenu
                    item={item}
                    selectedItems={selectedItems}
                    shareId={shareId}
                    position={contextMenuPosition}
                    {...contextMenu}
                />
            )}
            <div
                ref={contextMenu.anchorRef}
                role="button"
                tabIndex={0}
                draggable={draggable}
                aria-disabled={item.Disabled}
                className={classnames([
                    'pd-fb-grid-item m0-5 flex flex-column w100 rounded bordered cursor-pointer text-align-left no-outline',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) &&
                        'pd-fb-grid-item--highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                {...itemHandlers}
            >
                <div className="flex flex-items-center">
                    <div
                        role="presentation"
                        className="pl0-5 pt0-5 pb0-5 pr0-25 flex relative"
                        {...checkboxWrapperHandlers}
                    >
                        <Checkbox
                            disabled={item.Disabled}
                            className="increase-surface-click"
                            checked={isSelected}
                            {...checkboxHandlers}
                        />
                    </div>

                    {item.SharedUrl && <SharedURLIcon expired={item.UrlsExpired} />}
                </div>
                <div className="p0-5 flex flex-item-fluid flex-column">
                    <div className="flex flex-item-fluid flex-justify-center flex-items-center">
                        <FileIcon
                            size={28}
                            mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType}
                            alt={iconText}
                        />
                    </div>
                </div>
                <div className="w100 pt0-25 pb0-25 pl0-5 pr0-5 border-top ellipsis" title={item.Name}>
                    <span className="pre">{item.Name}</span>
                </div>
            </div>
        </div>
    );
}

export default ItemCell;
