import React, { useRef, useState } from 'react';
import { c, msgid } from 'ttag';

import {
    TableRow,
    Checkbox,
    Time,
    useActiveBreakpoint,
    classnames,
    useDragMove,
    DragMoveContainer,
    FileIcon,
    usePopperAnchor,
} from 'react-components';
import readableTime from 'proton-shared/lib/helpers/readableTime';
import { dateLocale } from 'proton-shared/lib/i18n';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { noop } from 'proton-shared/lib/helpers/function';

import { FileBrowserItem } from './interfaces';
import { LinkType } from '../../interfaces/link';
import LocationCell from './LocationCell';
import { DragMoveControls } from '../../hooks/drive/useDriveDragMove';
import { selectMessageForItemList } from '../Drive/helpers';
import RowContextMenu from './RowContextMenu';

interface Props {
    item: FileBrowserItem;
    shareId: string;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    showLocation?: boolean;
    secondaryActionActive?: boolean;
    dragMoveControls?: DragMoveControls;
}

const ItemRow = ({
    item,
    shareId,
    selectedItems,
    onToggleSelect,
    onClick,
    onShiftClick,
    showLocation,
    selectItem,
    secondaryActionActive,
    dragMoveControls,
}: Props) => {
    const { dragging, handleDragEnd, handleDragStart, DragMoveContent } = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: 'pd-custom',
        formatter: JSON.stringify,
    });

    const { isDesktop } = useActiveBreakpoint();
    const touchStarted = useRef(false);
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLTableRowElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) => (item.Disabled ? undefined : fn);

    const isFolder = item.Type === LinkType.FOLDER;

    const isSelected = selectedItems.some(({ LinkID }) => item.LinkID === LinkID);

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

    const handleContextMenu = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();

        if (item.Trashed || item.Disabled) {
            return;
        }
        e.preventDefault();

        if (!isSelected) {
            selectItem(item.LinkID);
        }

        if (isOpen) {
            close();
        }

        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
            onClick?.(item);
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (e.shiftKey) {
            onShiftClick(item.LinkID);
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

    const cells = [
        <div
            role="presentation"
            key="select"
            className="flex"
            onClick={handleClick}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <Checkbox
                disabled={item.Disabled}
                className="increase-surface-click"
                checked={isSelected}
                onClick={(e) => {
                    const el = document.activeElement ?? e.currentTarget;
                    if (isSelected && 'blur' in el) {
                        (el as any).blur();
                    }
                    if (!e.shiftKey) {
                        onToggleSelect(item.LinkID);
                    }
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
        ),
    ].filter(Boolean);

    const isDraggingSelected = selectedItems.some(({ LinkID }) => LinkID === item.LinkID);
    const dragMoveItems = isDraggingSelected ? selectedItems : [item];
    const movingCount = dragMoveItems.length;

    const texts = {
        allFiles: c('Notification').ngettext(msgid`Move ${movingCount} file`, `Move ${movingCount} files`, movingCount),
        allFolders: c('Notification').ngettext(
            msgid`Move ${movingCount} folder`,
            `Move ${movingCount} folders`,
            movingCount
        ),
        mixed: c('Notification').ngettext(msgid`Move ${movingCount} item`, `Move ${movingCount} items`, movingCount),
    };

    const moveText = selectMessageForItemList(
        dragMoveItems.map((item) => item.Type),
        texts
    );

    const handleRowDragStart = (e: React.DragEvent<HTMLTableRowElement>) => {
        if (!isDraggingSelected) {
            selectItem(item.LinkID);
        }
        handleDragStart(e);
    };

    return (
        <>
            {dragMoveControls && (
                <DragMoveContent>
                    <DragMoveContainer>{moveText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                cells={cells}
                draggable={!!dragMoveControls}
                tabIndex={0}
                role="button"
                ref={anchorRef}
                aria-disabled={item.Disabled}
                className={classnames([
                    'no-outline',
                    (onClick || secondaryActionActive) && !item.Disabled && 'cursor-pointer',
                    (isSelected || dragMoveControls?.isActiveDropTarget || item.Disabled) && 'bg-global-highlight',
                    (dragging || item.Disabled) && 'opacity-50',
                ])}
                onKeyDown={unlessDisabled(handleKeyDown)}
                onClick={unlessDisabled(handleRowClick)}
                onContextMenu={handleContextMenu}
                onTouchStart={unlessDisabled(handleTouchStart)}
                onTouchMove={unlessDisabled(handleTouchCancel)}
                onTouchCancel={unlessDisabled(handleTouchCancel)}
                onTouchEnd={unlessDisabled(handleTouchEnd)}
                onDragStart={unlessDisabled(handleRowDragStart)}
                onDragOver={unlessDisabled(dragMoveControls?.handleDragOver)}
                onDrop={unlessDisabled(dragMoveControls?.handleDrop)}
                onDragLeave={unlessDisabled(dragMoveControls?.handleDragLeave)}
                onDragEnd={(e) => {
                    e.currentTarget.blur();
                    handleDragEnd();
                }}
                onMouseDown={() => document.getSelection()?.removeAllRanges()}
            />
            {!item.Disabled && !item.Trashed && (
                <RowContextMenu
                    item={item}
                    isOpen={isOpen}
                    open={open}
                    close={close}
                    position={contextMenuPosition}
                    anchorRef={anchorRef}
                />
            )}
        </>
    );
};

export default ItemRow;
