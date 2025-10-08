import type { DragEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { c, msgid } from 'ttag';

import useItemsDraggable from '@proton/components/containers/items/useItemsDraggable';
import useItemsDroppable from '@proton/components/containers/items/useItemsDroppable';
import { useBulkEnabled, useBulkSelection } from '@proton/pass/components/Bulk/BulkSelectionState';
import { useStableRef } from '@proton/pass/hooks/useStableRef';
import { fromItemKey, getItemKey } from '@proton/pass/lib/items/item.utils';
import type { SelectedItem } from '@proton/pass/types';
import { partialMerge } from '@proton/pass/utils/object/merge';
import noop from '@proton/utils/noop';

export type DraggableItem = { ID?: string };
export type ItemDropProps = ReturnType<typeof useItemsDroppable>;
export type ItemDragProps = {
    handleDragStart: (event: DragEvent, item: DraggableItem) => void;
    handleDragEnd: (event: DragEvent) => void;
    draggable: boolean;
};

const EMPTY_LIST: DraggableItem[] = [];
const NOOP_DRAG: Partial<ItemDragProps> = {};
const NOOP_DROP: Partial<ItemDropProps> = {};

const getDragHtml = ({ length: count }: string[]) =>
    c('Info').ngettext(msgid`Move ${count} item`, `Move ${count} items`, count);

/** Items can be dragged from any view including Pass Monitor view,
 * except in the cases defined by this `draggable` flag. */
export const useCanDragItems = () => !EXTENSION_BUILD;

export const useItemDrag: () => Partial<ItemDragProps> = EXTENSION_BUILD
    ? () => NOOP_DRAG
    : () => {
          const bulkEnabled = useBulkEnabled();
          const bulk = useBulkSelection();
          const draggable = useCanDragItems();

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
                  draggable,
              }),
              [handleDragStart, handleDragEnd, draggable]
          );
      };

export const useItemDrop: (onDrop: (items: SelectedItem[]) => void, filter?: () => boolean) => Partial<ItemDropProps> =
    EXTENSION_BUILD
        ? () => NOOP_DROP
        : (onDrop, filter) => {
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
