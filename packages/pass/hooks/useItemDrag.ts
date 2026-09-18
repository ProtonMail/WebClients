import type { DragEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { c, msgid } from 'ttag';

import useItemsDraggable from '@proton/components/containers/items/useItemsDraggable';
import useItemsDroppable from '@proton/components/containers/items/useItemsDroppable';
import noop from '@proton/utils/noop';

import { useBulkEnabled, useBulkSelection } from '../components/Bulk/BulkSelectionState';
import { fromItemKey, getItemKey } from '../lib/items/item.utils';
import type { SelectedItem } from '../types';
import { partialMerge } from '../utils/object/merge';
import { useStableRef } from './useStableRef';

export type DraggableItem = { ID?: string };
export type ItemDropProps = ReturnType<typeof useItemsDroppable>;
export type ItemDragProps = {
    handleDragStart: (event: DragEvent, item: DraggableItem) => void;
    handleDragEnd: (event: DragEvent) => void;
    draggable: boolean;
};

const EMPTY_LIST: DraggableItem[] = [];

const getDragHtml = ({ length: count }: string[]) =>
    c('Info').ngettext(msgid`Move ${count} item`, `Move ${count} items`, count);

export const useItemDrag = (): Partial<ItemDragProps> => {
    const bulkEnabled = useBulkEnabled();
    const bulk = useBulkSelection();

    const selectedItems = useMemo<string[]>(
        () =>
            bulkEnabled
                ? Array.from(bulk.selection.entries()).flatMap(([shareId, itemIds]) =>
                      Array.from(itemIds.values()).map((itemId) => getItemKey({ itemId, shareId }))
                  )
                : [],
        [bulkEnabled, bulk.selection]
    );

    /** Using stable ref here to derive stable `handleDragStart`
     * and `handleDragEnd` methods from `useItemsDraggable` */
    const draggableItems = useStableRef(selectedItems);

    /** We're keeping selection state outside of the
     * `useItemsDraggable` hook - as such no need to
     * keep track of the full items list in this hook. */
    const { handleDragStart, handleDragEnd } = useItemsDraggable(EMPTY_LIST, draggableItems, noop, getDragHtml);

    return useMemo(
        () => ({
            handleDragStart,
            handleDragEnd,
            draggable: true,
        }),
        [handleDragStart, handleDragEnd]
    );
};

export const useItemDrop = (
    onDrop: (items: SelectedItem[]) => void,
    filter?: () => boolean
): Partial<ItemDropProps> => {
    const dragFilter = useCallback(filter ?? (() => true), [filter]);
    const onDropHandler = useCallback((itemKeys: string[]) => onDrop(itemKeys.map(fromItemKey)), [onDrop]);
    const droppable = useItemsDroppable(dragFilter, 'move', onDropHandler);

    return useMemo<ItemDropProps>(
        () =>
            partialMerge(droppable, {
                dragProps: {
                    onDrop: (event: DragEvent) => droppable.handleDrop(event),
                },
            }),
        [droppable]
    );
};
