import React, { useState } from 'react';
import { LinkType } from '../../interfaces/link';
import useDrive from './useDrive';
import useListNotifications from '../util/useListNotifications';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';

export interface DragMoveControls {
    handleDragOver: ((event: React.DragEvent<HTMLTableRowElement>) => void) | undefined;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
}

function useDriveDragMove(shareId: string, selectedItems: FileBrowserItem[]) {
    const { moveLinks, events } = useDrive();
    const { createMoveLinksNotifications } = useListNotifications();
    const [allDragging, setAllDragging] = useState<FileBrowserItem[]>([]);

    const getDragMoveControls = (item: FileBrowserItem): DragMoveControls => {
        const dragging = allDragging.some(({ LinkID }) => LinkID === item.LinkID);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ LinkID }) => LinkID === item.LinkID) ? selectedItems : [item])
                : setAllDragging([]);

        const handleDrop = async () => {
            const result = await moveLinks(
                shareId,
                item.LinkID,
                allDragging.map(({ LinkID }) => LinkID)
            );

            createMoveLinksNotifications(selectedItems, result);

            await events.call(shareId);
        };

        const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>) => {
            if (item.Type === LinkType.FOLDER && allDragging.every(({ LinkID }) => item.LinkID !== LinkID)) {
                event.dataTransfer.dropEffect = 'move';
                event.preventDefault();
            }
        };

        return { handleDragOver, handleDrop, dragging, setDragging };
    };

    return getDragMoveControls;
}

export default useDriveDragMove;
