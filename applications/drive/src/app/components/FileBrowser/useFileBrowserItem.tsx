import { useRef, useCallback, useState } from 'react';
import { msgid, c } from 'ttag';

import { usePopperAnchor, useDragMove } from '@proton/components';
import noop from '@proton/utils/noop';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';

import { selectMessageForItemList } from '../sections/helpers';
import { FileBrowserItem, DragMoveControls } from './interface';

const DOUBLE_CLICK_MS = 500;

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
    // Timer for click and double click detection.
    const clickTimerIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const touchStarted = useRef(false);
    const contextMenu = usePopperAnchor<T>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const dragMove = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: CUSTOM_DATA_FORMAT,
        formatter: JSON.stringify,
    });
    const isSelected = selectedItems.some(({ linkId }) => item.linkId === linkId);
    const isDraggingSelected = selectedItems.some(({ linkId }) => linkId === item.linkId);
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
        dragMoveItems.map((item) => item.isFile),
        texts
    );

    const iconText = `${!item.isFile ? c('Label').t`Folder` : `${c('Label').t`File`} - ${item.mimeType}`} - ${
        item.name
    }`;

    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) => (item.isLocked ? undefined : fn);

    const handleClick = unlessDisabled(
        useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();
                if (clickTimerIdRef.current) {
                    clearTimeout(clickTimerIdRef.current);
                    clickTimerIdRef.current = undefined;
                    onClick?.(item);
                } else {
                    // We do selection right away, not in timeout, because then
                    // would app look like slow. There is no harm to select
                    // items right away even if we navigate to different folder
                    // or show file preview in few milliseconds.
                    if (e.shiftKey) {
                        onShiftClick?.(item.linkId);
                    } else if (e.ctrlKey || e.metaKey) {
                        onToggleSelect(item.linkId);
                    } else {
                        selectItem(item.linkId);
                    }
                    clickTimerIdRef.current = setTimeout(() => {
                        clickTimerIdRef.current = undefined;
                    }, DOUBLE_CLICK_MS);
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
                    selectItem(item.linkId);
                }
                dragMove.handleDragStart(e);
            },
            [isDraggingSelected, dragMove.handleDragStart, selectItem]
        )
    );

    const handleContextMenuHelper = useCallback(
        (e: React.MouseEvent | React.TouchEvent, top: number, left: number) => {
            e.stopPropagation();

            if (item.isLocked) {
                return;
            }
            e.preventDefault();

            if (!isSelected) {
                selectItem(item.linkId);
            }

            if (contextMenu.isOpen) {
                contextMenu.close();
            }

            setContextMenuPosition({ top, left });
        },
        [contextMenu.isOpen, isSelected, item.isLocked, item.linkId, selectItem]
    );

    const handleContextMenu = useCallback(
        (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
            handleContextMenuHelper(e, e.clientY, e.clientX);
        },
        [handleContextMenuHelper]
    );

    const handleTouchContextMenu = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => {
            const touch = e.touches[0];
            handleContextMenuHelper(e, touch.clientX, touch.clientY);
        },
        [handleContextMenuHelper]
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
                onToggleSelect(item.linkId);
            }
        },
        [onToggleSelect, item.linkId]
    );

    const handleCheckboxWrapperClick = useCallback(
        (e) => {
            e.stopPropagation();
            // Wrapper handles shift key, because FF has issues: https://bugzilla.mozilla.org/show_bug.cgi?id=559506
            if (e.shiftKey) {
                onShiftClick?.(item.linkId);
            }
        },
        [onShiftClick, item.linkId]
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

    const draggable = dragMoveControls && !item.isLocked;

    return {
        isFolder: !item.isFile,
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
        optionsHandlers: {
            onClick: handleContextMenu,
            onTouchStart: handleTouchContextMenu,
        },
        moveText,
        contextMenu,
        contextMenuPosition,
        isSelected,
    };
}

export default useFileBrowserItem;
