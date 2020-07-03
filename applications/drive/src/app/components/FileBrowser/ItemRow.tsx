import React, { useRef } from 'react';
import { c, msgid } from 'ttag';

import { TableRow, Checkbox, Time, useActiveBreakpoint, classnames } from 'react-components';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { LinkType } from '../../interfaces/link';
import { FileBrowserItem } from './FileBrowser';
import FileIcon from '../FileIcon/FileIcon';
import LocationCell from './LocationCell';
import useDragMove from '../../hooks/util/useDragMove';
import { DragMoveControls } from '../../hooks/drive/useDriveDragMove';
import { selectMessageForItemList } from '../Drive/helpers';

interface Props {
    item: FileBrowserItem;
    shareId: string;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    onShiftClick: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    showLocation?: boolean;
    secondaryActionActive?: boolean;
    dragMoveControls: DragMoveControls;
}

const ItemRow = ({
    item,
    shareId,
    selectedItems,
    onToggleSelect,
    onClick,
    onShiftClick,
    showLocation,
    secondaryActionActive,
    dragMoveControls
}: Props) => {
    const { handleDragOver, handleDrop } = dragMoveControls;
    const { dragging, handleDragEnd, handleDragStart, DragMoveContent } = useDragMove(dragMoveControls);
    const { isDesktop } = useActiveBreakpoint();
    const touchStarted = useRef(false);

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        if (e.shiftKey) {
            onShiftClick(item.LinkID);
        } else if (e.ctrlKey || e.metaKey) {
            onToggleSelect(item.LinkID);
        } else {
            onClick?.(item);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            onClick?.(item);
        }
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        touchStarted.current = true;
    };

    const handleTouchCancel = () => {
        if (touchStarted.current) {
            touchStarted.current = false;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLTableRowElement>) => {
        if (touchStarted.current) {
            onClick?.(item);
            e.preventDefault();
        }
        touchStarted.current = false;
    };

    const isFolder = item.Type === LinkType.FOLDER;
    const isSelected = selectedItems.some(({ LinkID }) => item.LinkID === LinkID);
    const cells = [
        <div
            key="select"
            className="flex"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            <Checkbox
                className="increase-surface-click"
                checked={isSelected}
                onChange={(e) => {
                    if (isSelected) {
                        e.target.blur();
                    }
                    onToggleSelect(item.LinkID);
                }}
            />
        </div>,
        <div key="filename" className="flex flex-items-center flex-nowrap">
            <FileIcon mimeType={item.Type === LinkType.FOLDER ? 'Folder' : item.MIMEType} />
            <span title={item.Name} className="ellipsis">
                <span className="pre">{item.Name}</span>
            </span>
        </div>,
        showLocation && <LocationCell shareId={shareId} item={item} />,
        isFolder ? c('Label').t`Folder` : c('Label').t`File`,
        isDesktop && (
            <div
                className="ellipsis"
                title={readableTime(item.Trashed ?? item.ModifyTime, 'PPp', { locale: dateLocale })}
            >
                <Time key="dateModified" format="PPp">
                    {item.Trashed ?? item.ModifyTime}
                </Time>
            </div>
        ),
        isFolder ? (
            '-'
        ) : (
            <div key="size" className="ellipsis" title={humanSize(item.Size)}>
                {humanSize(item.Size)}
            </div>
        )
    ].filter(Boolean);

    const dragMoveItems = selectedItems.some(({ LinkID }) => LinkID === item.LinkID) ? selectedItems : [item];
    const movingCount = dragMoveItems.length;

    const texts = {
        allFiles: c('Notification').ngettext(msgid`Move ${movingCount} file`, `Move ${movingCount} files`, movingCount),
        allFolders: c('Notification').ngettext(
            msgid`Move ${movingCount} folder`,
            `Move ${movingCount} folders`,
            movingCount
        ),
        mixed: c('Notification').ngettext(msgid`Move ${movingCount} item`, `Move ${movingCount} items`, movingCount)
    };

    const moveText = selectMessageForItemList(
        dragMoveItems.map((item) => item.Type),
        texts
    );

    return (
        <>
            <DragMoveContent>
                <div className="color-black bold bg-white p1 bordered-container rounded">{moveText}</div>
            </DragMoveContent>
            <TableRow
                draggable
                tabIndex={0}
                role="button"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={classnames([
                    'no-outline',
                    (onClick || secondaryActionActive) && 'cursor-pointer',
                    isSelected && 'bg-global-highlight',
                    dragging && 'opacity-50'
                ])}
                onMouseDown={() => document.getSelection()?.removeAllRanges()}
                onKeyDown={handleKeyDown}
                onClick={handleRowClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchCancel}
                onTouchCancel={handleTouchCancel}
                onTouchEnd={handleTouchEnd}
                cells={cells}
            />
        </>
    );
};

export default ItemRow;
