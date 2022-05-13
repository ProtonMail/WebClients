import { useEffect } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { Button, Icon, FileIcon, Checkbox, classnames, DragMoveContainer, FileNameDisplay } from '@proton/components';

import { useThumbnailsDownload } from '../../../store';
import SignatureIcon from '../../SignatureIcon';
import { ItemProps } from '../interface';
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
        optionsHandlers,
    } = useFileBrowserItem<HTMLDivElement>({
        item,
        onToggleSelect,
        selectItem,
        selectedItems,
        dragMoveControls,
        onClick,
        onShiftClick,
    });

    const { addToDownloadQueue } = useThumbnailsDownload();

    useEffect(() => {
        if (item.hasThumbnail) {
            addToDownloadQueue(shareId, item.linkId, item.activeRevision?.id);
        }
    }, [item.activeRevision?.id, item.hasThumbnail]);

    return (
        <div className={classnames(['flex flex-col opacity-on-hover-container', className])} style={style}>
            {draggable && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            {!item.isLocked && ItemContextMenu && <ItemContextMenu position={contextMenuPosition} {...contextMenu} />}
            <div
                ref={contextMenu.anchorRef}
                role="button"
                tabIndex={0}
                draggable={draggable}
                aria-disabled={item.isLocked}
                className={classnames([
                    'file-browser-grid-item m0-5 flex flex-column w100 rounded border text-align-left',
                    isSelected && 'border-primary',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.isLocked) &&
                        'file-browser-grid-item--highlight',
                    (dragging || item.isLocked) && 'opacity-50',
                ])}
                {...itemHandlers}
            >
                <div className="flex flex-item-fluid flex-justify-center flex-align-items-center file-browser-grid-item--container">
                    {item.cachedThumbnailUrl ? (
                        <img
                            src={item.cachedThumbnailUrl}
                            className="file-browser-grid-item--thumbnail"
                            alt={iconText}
                        />
                    ) : (
                        <FileIcon size={48} mimeType={item.isFile ? item.mimeType : 'Folder'} alt={iconText} />
                    )}
                </div>
                <div
                    className={classnames([
                        'flex file-browser-grid-item--select',
                        selectedItems.length ? null : 'opacity-on-hover-only-desktop',
                    ])}
                    {...checkboxWrapperHandlers}
                >
                    <Checkbox
                        disabled={item.isLocked}
                        className="increase-click-surface file-browser-grid-item-checkbox"
                        checked={isSelected}
                        {...checkboxHandlers}
                    />
                </div>
                <div className="file-browser-grid-item--file-name flex border-top" title={item.name}>
                    <SignatureIcon item={item} className="file-browser-grid-view--signature-icon" />
                    <FileNameDisplay text={item.name} className="center" />
                    <Button
                        shape="ghost"
                        size="small"
                        icon
                        className={classnames([
                            'file-browser-grid-view--options',
                            contextMenu.isOpen ? 'file-browser--options-focus' : 'opacity-on-hover-only-desktop',
                        ])}
                        {...optionsHandlers}
                    >
                        <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ItemCell;
