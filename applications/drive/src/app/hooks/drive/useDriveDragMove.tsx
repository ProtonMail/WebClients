import { useState, useRef } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { useGlobalLoader } from '@proton/components';
import noop from '@proton/utils/noop';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';

import { useActions } from '../../store';
import { FileBrowserItem, DragMoveControls } from '../../components/FileBrowser/interface';

export default function useDriveDragMove(
    shareId: string,
    selectedItems: FileBrowserItem[],
    clearSelections: () => void
) {
    const { moveLinks } = useActions();
    const withGlobalLoader = useGlobalLoader({ text: c('Info').t`Moving files` });
    const [allDragging, setAllDragging] = useState<FileBrowserItem[]>([]);
    const [activeDropTarget, setActiveDropTarget] = useState<FileBrowserItem>();
    const dragEnterCounter = useRef(0);

    const getHandleItemDrop = (newParentLinkId: string) => async (e: React.DragEvent) => {
        let toMove: FileBrowserItem[];
        try {
            toMove = JSON.parse(e.dataTransfer.getData(CUSTOM_DATA_FORMAT));
        } catch (err: any) {
            // Data should be set by useFileBrowserItem when drag starts.
            // If the data transfer was not available or the move was so
            // fast that the data were not set yet, we should ignore the
            // event.
            console.warn('Could not finish move operation due to', err);
            return;
        }
        dragEnterCounter.current = 0;

        clearSelections();
        setActiveDropTarget(undefined);

        await withGlobalLoader(moveLinks(new AbortController().signal, shareId, toMove, newParentLinkId));
    };

    const getDragMoveControls = (item: FileBrowserItem): DragMoveControls => {
        const dragging = allDragging.some(({ linkId }) => linkId === item.linkId);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ linkId }) => linkId === item.linkId) ? selectedItems : [item])
                : setAllDragging([]);

        const isActiveDropTarget = activeDropTarget?.linkId === item.linkId;
        const availableTarget = !item.isFile && allDragging.every(({ linkId }) => item.linkId !== linkId);
        const handleDrop = getHandleItemDrop(item.linkId);

        const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
            if (availableTarget) {
                e.dataTransfer.dropEffect = 'move';
                e.preventDefault();
                if (dragEnterCounter.current === 1 && !isActiveDropTarget) {
                    setActiveDropTarget(item);
                }
            }
        };

        const handleDragLeave = () => {
            if (availableTarget) {
                dragEnterCounter.current -= 1;

                if (dragEnterCounter.current <= 0 && isActiveDropTarget) {
                    setActiveDropTarget(undefined);
                }
            }
        };

        const handleDragEnter = () => {
            if (availableTarget) {
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
        };
    };

    return { getDragMoveControls, getHandleItemDrop };
}

export function useDriveDragMoveTarget(shareId: string) {
    const { getHandleItemDrop } = useDriveDragMove(shareId, [], noop);
    return { getHandleItemDrop };
}
