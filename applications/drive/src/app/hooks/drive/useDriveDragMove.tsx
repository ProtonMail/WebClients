import React, { useState, useRef } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { LinkType, LinkMeta } from '../../interfaces/link';
import useDrive from './useDrive';
import useListNotifications from '../util/useListNotifications';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';
import { useDriveActiveFolder } from '../../components/Drive/DriveFolderProvider';
import { CUSTOM_DATA_FORMAT } from '../../constants';

export interface DragMoveControls {
    handleDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    handleDragLeave: () => void;
    handleDragEnter: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
    isActiveDropTarget: boolean;
}

export default function useDriveDragMove(
    shareId: string,
    selectedItems: FileBrowserItem[],
    clearSelections: () => void
) {
    const { moveLinks } = useDrive();
    const { folder: activeFolder } = useDriveActiveFolder();
    const { createMoveLinksNotifications } = useListNotifications();
    const [allDragging, setAllDragging] = useState<FileBrowserItem[]>([]);
    const [activeDropTarget, setActiveDropTarget] = useState<FileBrowserItem>();
    const dragEnterCounter = useRef(0);

    const getHandleItemDrop = <T extends FileBrowserItem | LinkMeta>(item: T) => async (e: React.DragEvent) => {
        const toMove: T[] = JSON.parse(e.dataTransfer.getData(CUSTOM_DATA_FORMAT));
        const toMoveIds = toMove.map(({ LinkID }) => LinkID);
        const parentFolderId = activeFolder?.linkId;
        dragEnterCounter.current = 0;

        clearSelections();
        setActiveDropTarget(undefined);

        const moveResult = await moveLinks(shareId, item.LinkID, toMoveIds);

        const undoAction = async () => {
            if (!parentFolderId) {
                return;
            }
            const toMoveBackIds = moveResult.moved.map(({ LinkID }) => LinkID);
            const moveBackResult = await moveLinks(shareId, parentFolderId, toMoveBackIds);
            createMoveLinksNotifications(toMove, moveBackResult);
        };

        createMoveLinksNotifications(toMove, moveResult, undoAction);
    };

    const getDragMoveControls = (item: FileBrowserItem): DragMoveControls => {
        const dragging = allDragging.some(({ LinkID }) => LinkID === item.LinkID);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ LinkID }) => LinkID === item.LinkID) ? selectedItems : [item])
                : setAllDragging([]);

        const isActiveDropTarget = activeDropTarget?.LinkID === item.LinkID;
        const availableTarget =
            item.Type === LinkType.FOLDER && allDragging.every(({ LinkID }) => item.LinkID !== LinkID);
        const handleDrop = getHandleItemDrop(item);

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
