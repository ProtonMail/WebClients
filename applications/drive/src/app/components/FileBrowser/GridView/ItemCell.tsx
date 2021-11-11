import { useEffect } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { Button, Icon, FileIcon, Checkbox, classnames, DragMoveContainer, FileNameDisplay } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ItemProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import SharedURLIcon from '../SharedURLIcon';
import useFileBrowserItem from '../useFileBrowserItem';
import { useThumbnailsDownloadProvider } from '../../downloads/ThumbnailDownloadProvider';

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
    ItemContextMenu,
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

    const thumbnailProvider = useThumbnailsDownloadProvider();

    useEffect(() => {
        if (item.HasThumbnail) {
            thumbnailProvider.addToDownloadQueue(
                { modifyTime: item.ModifyTime },
                {
                    ShareID: shareId,
                    LinkID: item.LinkID,
                }
            );
        }
    }, [item.ModifyTime]); // Reload thumbnail when file changes.

    return (
        <div className={classnames(['flex flex-col', className])} style={style}>
            {draggable && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            {!item.Disabled && ItemContextMenu && (
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
                    'file-browser-grid-item m0-5 flex flex-column w100 rounded bordered cursor-pointer text-align-left no-outline',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) &&
                        'file-browser-grid-item--highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                {...itemHandlers}
            >
                <div className="flex flex-item-fluid flex-justify-center flex-align-items-center file-browser-grid-item--container">
                    {item.CachedThumbnailURL ? (
                        <img
                            src={item.CachedThumbnailURL}
                            className="file-browser-grid-item--thumbnail"
                            alt={iconText}
                        />
                    ) : (
                        <FileIcon
                            size={56}
                            mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType}
                            alt={iconText}
                        />
                    )}
                    {item.SharedUrl && (
                        <SharedURLIcon
                            shareId={shareId}
                            item={item}
                            className="flex file-browser-grid-item--share-icon"
                        />
                    )}
                </div>
                <div
                    className={classnames([
                        'flex file-browser-grid-item--select',
                        selectedItems.length ? null : 'file-browser-grid-item--select-hover-only',
                    ])}
                    {...checkboxWrapperHandlers}
                >
                    <Checkbox
                        disabled={item.Disabled}
                        className="increase-click-surface file-browser-grid-item-checkbox"
                        checked={isSelected}
                        {...checkboxHandlers}
                    />
                </div>
                <div className="w100 pt0-5 pb0-5 pl3 pr3 flex border-top" title={item.Name}>
                    <FileNameDisplay text={item.Name} className="center" />
                    <Button
                        shape="ghost"
                        size="small"
                        icon
                        className="file-browser-grid-view--options"
                        onClick={(e) => itemHandlers.onContextMenu(e)}
                    >
                        <Icon name="ellipsis-vertical" alt={c('Action').t`More options`} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ItemCell;
