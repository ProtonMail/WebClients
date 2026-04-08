import { useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';

import type { DragMoveControls } from '../../statelessComponents/DriveExplorer/types';

interface UseDriveDragMoveOptions {
    isAvailableTarget: (uid: string) => boolean;
    clearSelections: () => void;
    onDrop: (itemUids: string[], newParentUid: string) => void;
    isFile?: (uid: string) => boolean;
}

export const useDriveDragMove = (
    selectedItemIds: string[],
    { isAvailableTarget, clearSelections, onDrop, isFile }: UseDriveDragMoveOptions
) => {
    const [allDragging, setAllDragging] = useState<string[]>([]);
    const [activeDropTarget, setActiveDropTarget] = useState<string>();
    const dragEnterCounter = useRef(0);

    const getHandleItemDrop = (newParentNodeUid: string) => (e: React.DragEvent) => {
        let toMove: string[];
        try {
            toMove = JSON.parse(e.dataTransfer.getData(CUSTOM_DATA_FORMAT));
        } catch (err: unknown) {
            console.warn('Could not finish move operation due to', err);
            return;
        }
        dragEnterCounter.current = 0;

        clearSelections();
        setActiveDropTarget(undefined);
        onDrop(toMove, newParentNodeUid);
    };

    const getDragFeedbackText = (dragUids: string[]): string => {
        const dragCount = dragUids.length;
        if (!isFile) {
            return c('Info').ngettext(msgid`Move ${dragCount} item`, `Move ${dragCount} items`, dragCount);
        }
        const fileCount = dragUids.filter(isFile).length;
        const folderCount = dragCount - fileCount;
        if (fileCount > 0 && folderCount === 0) {
            return c('Info').ngettext(msgid`Move ${fileCount} file`, `Move ${fileCount} files`, fileCount);
        }
        if (folderCount > 0 && fileCount === 0) {
            return c('Info').ngettext(msgid`Move ${folderCount} folder`, `Move ${folderCount} folders`, folderCount);
        }
        return c('Info').ngettext(msgid`Move ${dragCount} item`, `Move ${dragCount} items`, dragCount);
    };

    const getDragMoveControls = (nodeUid: string): DragMoveControls => {
        const isSelected = selectedItemIds.includes(nodeUid);
        const dragUids = isSelected ? selectedItemIds : [nodeUid];
        const dragFeedbackText = getDragFeedbackText(dragUids);

        const dragging = allDragging.some((id) => id === nodeUid);
        const setDragging = (isDragging: boolean) =>
            isDragging ? setAllDragging(selectedItemIds) : setAllDragging([]);

        const isActiveDropTarget = activeDropTarget === nodeUid;
        const canDropIntoItem = (uid: string) => isAvailableTarget(uid) && allDragging.every((id) => id !== uid);
        const handleDrop = getHandleItemDrop(nodeUid);

        const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
            if (canDropIntoItem(nodeUid)) {
                e.dataTransfer.dropEffect = 'move';
                e.preventDefault();
                if (dragEnterCounter.current === 1 && !isActiveDropTarget) {
                    setActiveDropTarget(nodeUid);
                }
            }
        };

        const handleDragLeave = () => {
            if (canDropIntoItem(nodeUid)) {
                dragEnterCounter.current -= 1;

                if (dragEnterCounter.current <= 0 && isActiveDropTarget) {
                    setActiveDropTarget(undefined);
                }
            }
        };

        const handleDragEnter = () => {
            if (canDropIntoItem(nodeUid)) {
                dragEnterCounter.current += 1;
            }
        };

        return {
            handleDragOver,
            handleDrop,
            handleDragLeave,
            handleDragEnter,
            dragging,
            setDragging,
            isActiveDropTarget,
            selectedItemIds,
            canDropIntoItem,
            dragFeedbackText,
        };
    };

    return { getDragMoveControls, getHandleItemDrop };
};
