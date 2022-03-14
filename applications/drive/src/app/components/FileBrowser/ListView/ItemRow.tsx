import { memo, useEffect } from 'react';

import {
    Button,
    Icon,
    TableRow,
    Checkbox,
    useActiveBreakpoint,
    classnames,
    DragMoveContainer,
    FileIcon,
    TableCell,
} from '@proton/components';
import { isEquivalent, pick } from '@proton/shared/lib/helpers/object';
import { shallowEqual } from '@proton/shared/lib/helpers/array';
import { c } from 'ttag';
import { ItemProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { useThumbnailsDownload } from '../../../store';
import { formatAccessCount } from '../../../utils/formatters';
import useFileBrowserItem from '../useFileBrowserItem';
import LocationCell from './Cells/LocationCell';
import TimeCell from './Cells/TimeCell';
import SizeCell from './Cells/SizeCell';
import NameCell from './Cells/NameCell';
import CopyLinkIcon from '../CopyLinkIcon';

const ItemRow = ({
    item,
    style,
    shareId,
    selectedItems,
    onToggleSelect,
    onClick,
    onShiftClick,
    columns,
    selectItem,
    dragMoveControls,
    isPreview,
    ItemContextMenu,
}: ItemProps) => {
    const {
        isFolder,
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
    } = useFileBrowserItem<HTMLTableRowElement>({
        item,
        onToggleSelect,
        selectItem,
        selectedItems,
        dragMoveControls,
        onClick,
        onShiftClick,
    });

    const { isDesktop } = useActiveBreakpoint();
    const { addToDownloadQueue } = useThumbnailsDownload();

    useEffect(() => {
        if (item.HasThumbnail) {
            addToDownloadQueue(shareId, item.LinkID, item.ModifyTime);
        }
    }, [item.ModifyTime, item.HasThumbnail]);

    const generateExpiresCell = () => {
        const expiredPart = isDesktop ? (
            <span className="ml0-25">{c('Label').t`(Expired)`}</span>
        ) : (
            <span>{c('Label').t`Expired`}</span>
        );

        return (
            item.SharedUrl &&
            (item.SharedUrl.ExpireTime ? (
                <div className="flex flex-nowrap">
                    {(isDesktop || !item.UrlsExpired) && <TimeCell time={item.SharedUrl.ExpireTime} />}
                    {item.UrlsExpired ? expiredPart : null}
                </div>
            ) : (
                c('Label').t`Never`
            ))
        );
    };

    return (
        <>
            {draggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                style={style}
                draggable={draggable}
                tabIndex={0}
                role="button"
                ref={contextMenu.anchorRef}
                aria-disabled={item.Disabled}
                className={classnames([
                    'file-browser-list-item flex user-select-none opacity-on-hover-container',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) && 'bg-strong',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                data-testid={isSelected ? 'selected' : undefined}
                {...itemHandlers}
            >
                <TableCell className="m0 flex" data-testid="column-checkbox">
                    <div
                        role="presentation"
                        className={classnames([
                            'flex flex-align-items-center',
                            selectedItems.length ? null : 'opacity-on-hover-only-desktop',
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
                </TableCell>

                <TableCell
                    className="m0 flex flex-align-items-center flex-nowrap flex-item-fluid"
                    data-testid="column-name"
                >
                    {item.CachedThumbnailURL ? (
                        <img
                            src={item.CachedThumbnailURL}
                            alt={iconText}
                            className="file-browser-list-item--thumbnail flex-item-noshrink mr0-5"
                        />
                    ) : (
                        <FileIcon
                            mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType}
                            alt={iconText}
                            className="mr0-5"
                        />
                    )}
                    <NameCell name={item.Name} />
                </TableCell>

                {columns.includes('location') && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])} data-testid="column-location">
                        <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} isTrashed={!!item.Trashed} />
                    </TableCell>
                )}

                {columns.includes('original_location') && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w20' : 'w25'])} data-testid="column-location">
                        <LocationCell shareId={shareId} parentLinkId={item.ParentLinkID} />
                    </TableCell>
                )}

                {columns.includes('uploaded') && (
                    <TableCell className="m0 w15" data-testid="column-uploaded">
                        <TimeCell time={item.ModifyTime} />
                    </TableCell>
                )}

                {columns.includes('modified') && (
                    <TableCell className="m0 w15" data-testid="column-modified">
                        <TimeCell time={item.RealModifyTime} />
                    </TableCell>
                )}

                {columns.includes('trashed') && (
                    <TableCell className="m0 w25" data-testid="column-trashed">
                        <TimeCell time={item.Trashed || item.ModifyTime} />
                    </TableCell>
                )}

                {columns.includes('share_created') && (
                    <TableCell className="m0 w15" data-testid="column-share-created">
                        {item.SharedUrl?.CreateTime && <TimeCell time={item.SharedUrl.CreateTime} />}
                    </TableCell>
                )}

                {columns.includes('share_num_access') && (
                    <TableCell className="m0 w15" data-testid="column-num-accesses">
                        {formatAccessCount(item.SharedUrl?.NumAccesses)}
                    </TableCell>
                )}

                {columns.includes('share_expires') && (
                    <TableCell className="m0 w20" data-testid="column-share-expires">
                        {generateExpiresCell()}
                    </TableCell>
                )}

                {columns.includes('size') && (
                    <TableCell className={classnames(['m0', isDesktop ? 'w10' : 'w15'])} data-testid="column-size">
                        {isFolder ? '-' : <SizeCell size={item.Size} />}
                    </TableCell>
                )}

                {columns.includes('share_options') && (
                    <TableCell className="m0 file-browser-list--icon-column" data-testid="column-share-options">
                        <CopyLinkIcon shareId={shareId} item={item} />
                    </TableCell>
                )}

                <TableCell className="m0 file-browser-list--icon-column" data-testid="column-options">
                    <Button
                        shape="ghost"
                        size="small"
                        icon
                        className={contextMenu.isOpen ? 'file-browser--options-focus' : 'opacity-on-hover-only-desktop'}
                        {...optionsHandlers}
                    >
                        <Icon name="ellipsis-vertical" alt={c('Action').t`More options`} />
                    </Button>
                </TableCell>
            </TableRow>
            {!isPreview && !item.Disabled && ItemContextMenu && (
                <ItemContextMenu
                    item={item}
                    selectedItems={selectedItems}
                    shareId={shareId}
                    position={contextMenuPosition}
                    {...contextMenu}
                />
            )}
        </>
    );
};

export default memo(ItemRow, (a, b) => {
    if (isEquivalent(a, b)) {
        return true;
    }

    const cheapPropsToCheck: (keyof ItemProps)[] = ['shareId', 'style', 'onToggleSelect', 'onShiftClick', 'onClick'];
    const cheapPropsEqual = isEquivalent(pick(a, cheapPropsToCheck), pick(b, cheapPropsToCheck));

    if (
        !cheapPropsEqual ||
        !isEquivalent(a.item, b.item) ||
        !shallowEqual(a.selectedItems, b.selectedItems) ||
        !shallowEqual(a.columns, b.columns)
    ) {
        return false;
    }

    const dragControlsEqual =
        a.dragMoveControls?.dragging === b.dragMoveControls?.dragging &&
        a.dragMoveControls?.isActiveDropTarget === b.dragMoveControls?.isActiveDropTarget;

    return dragControlsEqual;
});
