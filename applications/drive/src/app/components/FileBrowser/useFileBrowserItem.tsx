import { useRef, useCallback, useState } from 'react';
import { usePopperAnchor, useDragMove } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { msgid, c } from 'ttag';
import { LinkType } from '../../interfaces/link';
import { FileBrowserItem, DragMoveControls } from './interfaces';
import { selectMessageForItemList } from '../sections/helpers';
import { CUSTOM_DATA_FORMAT } from '../../constants';

interface Options {
    item: FileBrowserItem;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick?: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    dragMoveControls?: DragMoveControls;
}

function useFileBrowserItem<T extends HTMLElement>({
    item,
    selectedItems,
    onShiftClick,
    onToggleSelect,
    selectItem,
    dragMoveControls,
    onClick,
}: Options) {
    const touchStarted = useRef(false);
    const contextMenu = usePopperAnchor<T>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const dragMove = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: CUSTOM_DATA_FORMAT,
        formatter: JSON.stringify,
    });
    const isFolder = item.Type === LinkType.FOLDER;
    const isSelected = selectedItems.some(({ LinkID }) => item.LinkID === LinkID);
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

    const iconText = `${isFolder ? c('Label').t`Folder` : `${c('Label').t`File`} - ${item.MIMEType}`} - ${item.Name}`;

    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) => (item.Disabled ? undefined : fn);

    const handleClick = unlessDisabled(
        useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();

                if (e.shiftKey) {
                    onShiftClick?.(item.LinkID);
                } else if (e.ctrlKey || e.metaKey) {
                    onToggleSelect(item.LinkID);
                } else {
                    onClick?.(item);
                }
            },
            [item, onShiftClick, onToggleSelect, onClick]
        )
    );

    const handleKeyDown = unlessDisabled(
        useCallback(
            (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    onClick?.(item);
                }
            },
            [onClick]
        )
    );

    const handleTouchStart = unlessDisabled(
        useCallback(
            (e: React.TouchEvent<HTMLTableRowElement>) => {
                e.stopPropagation();
                touchStarted.current = true;
            },
            [touchStarted]
        )
    );

    const handleTouchCancel = unlessDisabled(
        useCallback(() => {
            if (touchStarted.current) {
                touchStarted.current = false;
            }
        }, [touchStarted])
    );

    const handleTouchEnd = unlessDisabled(
        useCallback(
            (e: React.TouchEvent<HTMLTableRowElement>) => {
                if (touchStarted.current) {
                    onClick?.(item);
                    e.preventDefault();
                }
                touchStarted.current = false;
            },
            [touchStarted, onClick]
        )
    );

    const handleDragStart = unlessDisabled(
        useCallback(
            (e: React.DragEvent<HTMLTableRowElement>) => {
                if (!isDraggingSelected) {
                    selectItem(item.LinkID);
                }
                dragMove.handleDragStart(e);
            },
            [isDraggingSelected, dragMove.handleDragStart, selectItem]
        )
    );

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLTableRowElement>) => {
            e.stopPropagation();

            if (item.Disabled) {
                return;
            }
            e.preventDefault();

            if (!isSelected) {
                selectItem(item.LinkID);
            }

            if (contextMenu.isOpen) {
                contextMenu.close();
            }

            setContextMenuPosition({ top: e.clientY, left: e.clientX });
        },
        [contextMenu.isOpen, isSelected, item.Disabled, item.LinkID, selectItem]
    );

    const handleDragEnd = useCallback(
        (e) => {
            e.currentTarget.blur();
            dragMove.handleDragEnd();
        },
        [dragMove.handleDragEnd]
    );

    const handleMouseDown = useCallback(() => document.getSelection()?.removeAllRanges(), []);

    const handleCheckboxClick = useCallback(
        (e) => {
            if (!e.shiftKey) {
                onToggleSelect(item.LinkID);
            }
        },
        [onToggleSelect, item.LinkID]
    );

    const handleCheckboxWrapperClick = useCallback(
        (e) => {
            e.stopPropagation();
            // Wrapper handles shift key, because FF has issues: https://bugzilla.mozilla.org/show_bug.cgi?id=559506
            if (e.shiftKey) {
                onShiftClick?.(item.LinkID);
            }
        },
        [onShiftClick, item.LinkID]
    );

    const stopPropagation = useCallback((e) => {
        e.stopPropagation();
    }, []);

    const handleCheckboxChange = useCallback(
        (e) => {
            const el = document.activeElement ?? e.currentTarget;
            if (isSelected && 'blur' in el) {
                (el as any).blur();
            }
        },
        [isSelected]
    );

    const draggable = dragMoveControls && !item.Disabled;

    return {
        isFolder,
        iconText,
        dragMoveItems,
        dragMove,
        draggable,
        itemHandlers: {
            onContextMenu: handleContextMenu,
            onDrop: unlessDisabled(dragMoveControls?.handleDrop),
            onDragLeave: unlessDisabled(dragMoveControls?.handleDragLeave),
            onDragEnter: unlessDisabled(dragMoveControls?.handleDragEnter),
            onDragOver: unlessDisabled(dragMoveControls?.handleDragOver),
            onDragStart: handleDragStart,
            onTouchCancel: handleTouchCancel,
            onTouchMove: handleTouchCancel,
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
            onDragEnd: handleDragEnd,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            onMouseDown: handleMouseDown,
        },
        checkboxHandlers: {
            onClick: handleCheckboxClick,
            onChange: handleCheckboxChange,
        },
        checkboxWrapperHandlers: {
            onTouchStart: stopPropagation,
            onKeyDown: stopPropagation,
            onClick: handleCheckboxWrapperClick,
        },
        moveText,
        contextMenu,
        contextMenuPosition,
        isSelected,
    };
}

export default useFileBrowserItem;
