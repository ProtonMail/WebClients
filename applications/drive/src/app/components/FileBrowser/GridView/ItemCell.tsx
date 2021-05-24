import React, { useEffect } from 'react';

import { FileIcon, Checkbox, classnames, DragMoveContainer, FileNameDisplay } from 'react-components';

import { LinkType } from '../../../interfaces/link';
import { ItemProps } from '../interfaces';
import ItemContextMenu from '../ItemContextMenu';
import SharedURLIcon from '../SharedURLIcon';
import useFileBrowserItem from '../useFileBrowserItem';
import useFiles from '../../../hooks/drive/useFiles';
import useDrive from '../../../hooks/drive/useDrive';

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
    layoutType,
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

    const { downloadDriveFile } = useFiles();
    const { loadLinkCachedThumbnailURL } = useDrive();
    useEffect(() => {
        if (item.HasThumbnail) {
            loadLinkCachedThumbnailURL(
                shareId,
                item.LinkID,
                async (downloadUrl: string): Promise<Uint8Array[]> => {
                    const { contents } = await downloadDriveFile(shareId, item.LinkID, [
                        {
                            Index: 1,
                            URL: downloadUrl,
                        },
                    ]);
                    return contents;
                }
            ).catch(console.error);
        }
    }, []);

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
                    layoutType={layoutType}
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
                <div
                    className={classnames([
                        'flex file-browser-grid-item--select',
                        selectedItems.length ? null : 'file-browser-grid-item--select-hover-only',
                    ])}
                    {...checkboxWrapperHandlers}
                >
                    <Checkbox
                        disabled={item.Disabled}
                        className="increase-click-surface"
                        checked={isSelected}
                        {...checkboxHandlers}
                    />
                </div>
                {item.SharedUrl && (
                    <SharedURLIcon expired={item.UrlsExpired} className="flex file-browser-grid-item--share" />
                )}
                <div className="flex flex-item-fluid flex-justify-center flex-align-items-center">
                    {item.CachedThumbnailURL ? (
                        <img
                            src={item.CachedThumbnailURL}
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                            alt={iconText}
                        />
                    ) : (
                        <FileIcon
                            size={28}
                            mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType}
                            alt={iconText}
                        />
                    )}
                </div>
                <div className="w100 pt0-25 pb0-25 pl0-5 pr0-5 flex" title={item.Name}>
                    <FileNameDisplay text={item.Name} className="center" />
                </div>
            </div>
        </div>
    );
}

export default ItemCell;
