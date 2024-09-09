import { useRef, useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import { useGlobalLoader } from '@proton/components';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { useSelection } from '../../components/FileBrowser';
import type { DragMoveControls } from '../../components/FileBrowser/interface';
import type { DriveItem } from '../../components/sections/Drive/Drive';
import { useActions } from '../../store';
import type { LinkInfo } from '../../store/_actions/interface';

type DragAndDropItem = DriveItem;

export default function useDriveDragMove(shareId: string, contents: DragAndDropItem[], clearSelections: () => void) {
    const { moveLinks } = useActions();
    const withGlobalLoader = useGlobalLoader({ text: c('Info').t`Moving files` });
    const [allDragging, setAllDragging] = useState<DragAndDropItem[]>([]);
    const [activeDropTarget, setActiveDropTarget] = useState<DragAndDropItem>();
    const dragEnterCounter = useRef(0);
    const selectionControls = useSelection();

    const selectedItems = React.useMemo(
        () =>
            selectionControls?.selectedItemIds
                .map((selectedItemId) => contents.find(({ id, isLocked }) => !isLocked && selectedItemId === id))
                .filter(isTruthy) || [],
        [selectionControls?.selectedItemIds]
    );

    const getHandleItemDrop = (newParentLinkId: string) => async (e: React.DragEvent) => {
        let toMove: DragAndDropItem[];
        try {
            toMove = JSON.parse(e.dataTransfer.getData(CUSTOM_DATA_FORMAT));
        } catch (err: any) {
            // Data should be set by DecryptedLink when drag starts.
            // If the data transfer was not available or the move was so
            // fast that the data were not set yet, we should ignore the
            // event.
            console.warn('Could not finish move operation due to', err);
            return;
        }
        dragEnterCounter.current = 0;

        clearSelections();
        setActiveDropTarget(undefined);

        const toMoveInfo: LinkInfo[] = toMove.map((item) => ({
            parentLinkId: item.parentLinkId,
            name: item.name,
            isFile: item.isFile,
            linkId: item.linkId,
            rootShareId: shareId,
        }));

        await withGlobalLoader(
            moveLinks(new AbortController().signal, { shareId, linksToMove: toMoveInfo, newParentLinkId })
        );
    };

    const getDragMoveControls = (item: DragAndDropItem): DragMoveControls => {
        const dragging = allDragging.some(({ id }) => id === item.id);
        const setDragging = (isDragging: boolean) =>
            isDragging
                ? setAllDragging(selectedItems.some(({ id }) => id === item.id) ? selectedItems : [item])
                : setAllDragging([]);

        const isActiveDropTarget = activeDropTarget?.id === item.id;
        const availableTarget = !item.isFile && allDragging.every(({ id }) => item.id !== id);
        const handleDrop = getHandleItemDrop(item.id);

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
            selectedItems,
        };
    };

    return { getDragMoveControls, getHandleItemDrop };
}

export function useDriveDragMoveTarget(shareId: string) {
    const { getHandleItemDrop } = useDriveDragMove(shareId, [], noop);
    return { getHandleItemDrop };
}
