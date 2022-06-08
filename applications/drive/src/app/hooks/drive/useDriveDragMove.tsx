import { useState, useRef } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { useGlobalLoader } from '@proton/components';
import noop from '@proton/utils/noop';
import { FileBrowserItem, DragMoveControls } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';

import { useActions } from '../../store';

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
        const toMoveInfo = toMove.map(({ ParentLinkID, LinkID, Name, IsFile }) => ({
            parentLinkId: ParentLinkID,
            linkId: LinkID,
            name: Name,
            isFile: IsFile,
        }));
        dragEnterCounter.current = 0;

        clearSelections();
        setActiveDropTarget(undefined);

        await withGlobalLoader(moveLinks(new AbortController().signal, shareId, toMoveInfo, newParentLinkId));
    };

    const getDragMoveControls = (item: FileBrowserItem): DragMoveControls => {
        const dragging = allDragging.some(({ LinkID }) => LinkID === item.LinkID);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ LinkID }) => LinkID === item.LinkID) ? selectedItems : [item])
                : setAllDragging([]);

        const isActiveDropTarget = activeDropTarget?.LinkID === item.LinkID;
        const availableTarget = !item.IsFile && allDragging.every(({ LinkID }) => item.LinkID !== LinkID);
        const handleDrop = getHandleItemDrop(item.LinkID);

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
