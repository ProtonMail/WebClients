import React, { useState } from 'react';
import { LinkType } from '../../interfaces/link';
import useDrive from './useDrive';
import useListNotifications from '../util/useListNotifications';
import { FileBrowserItem } from '../../components/FileBrowser/interfaces';

type MovingItems = { [linkId: string]: FileBrowserItem };

export interface DragMoveControls {
    handleDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    handleDragLeave: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
    isActiveDropTarget: boolean;
    moving: MovingItems;
}

function useDriveDragMove(shareId: string, selectedItems: FileBrowserItem[], clearSelections: () => void) {
    const { moveLinks, events } = useDrive();
    const { createMoveLinksNotifications } = useListNotifications();
    const [allDragging, setAllDragging] = useState<FileBrowserItem[]>([]);
    const [moving, setMoving] = useState<MovingItems>({});
    const [activeDropTarget, setActiveDropTarget] = useState<FileBrowserItem>();

    const getDragMoveControls = (item: FileBrowserItem): DragMoveControls => {
        const dragging = allDragging.some(({ LinkID }) => LinkID === item.LinkID);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ LinkID }) => LinkID === item.LinkID) ? selectedItems : [item])
                : setAllDragging([]);

        const handleDrop = async () => {
            const toMove = [...allDragging];

            setMoving((moving) => ({
                ...moving,
                ...toMove.reduce(
                    (items, item) => ({
                        ...items,
                        [item.LinkID]: item,
                    }),
                    {}
                ),
            }));

            clearSelections();

            const result = await moveLinks(
                shareId,
                item.LinkID,
                toMove.map(({ LinkID }) => LinkID)
            );

            createMoveLinksNotifications(toMove, result);

            await events.call(shareId);

            setMoving((moving) => {
                const remaining = { ...moving };
                toMove.forEach(({ LinkID }) => {
                    delete remaining[LinkID];
                });
                return remaining;
            });
        };

        const isActiveDropTarget = activeDropTarget?.LinkID === item.LinkID;
        const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
            if (item.Type === LinkType.FOLDER && allDragging.every(({ LinkID }) => item.LinkID !== LinkID)) {
                e.dataTransfer.dropEffect = 'move';
                e.preventDefault();
                if (!isActiveDropTarget) {
                    setActiveDropTarget(item);
                }
            }
        };

        const handleDragLeave = () => {
            if (isActiveDropTarget) {
                setActiveDropTarget(undefined);
            }
        };

        return {
            handleDragOver,
            handleDrop,
            handleDragLeave,
            dragging,
            setDragging,
            isActiveDropTarget,
            moving,
        };
    };

    return getDragMoveControls;
}

export default useDriveDragMove;
