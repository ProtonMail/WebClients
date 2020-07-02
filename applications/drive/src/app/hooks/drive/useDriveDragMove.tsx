import React from 'react';
import { FileBrowserItem } from '../../components/FileBrowser/FileBrowser';
import { useState } from 'react';
import { LinkType } from '../../interfaces/link';
import useDrive from './useDrive';
import useListNotifications from '../util/useListNotifications';

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

        const handleDragOver =
            item.Type === LinkType.FOLDER && allDragging.every(({ LinkID }) => item.LinkID !== LinkID)
                ? (event: React.DragEvent<HTMLTableRowElement>) => {
                      event.dataTransfer.dropEffect = 'move';
                      event.preventDefault();
                  }
                : undefined;

        return { handleDragOver, handleDrop, dragging, setDragging };
    };

    return getDragMoveControls;
}

export default useDriveDragMove;
