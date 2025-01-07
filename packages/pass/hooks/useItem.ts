import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { selectItem, selectItemWithOptimistic, selectOptimisticItemState } from '@proton/pass/store/selectors/items';
import type {
    ItemOptimisticState,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    Maybe,
} from '@proton/pass/types';

export const useItem = <T extends ItemType = ItemType>(shareId: string, itemId: string): Maybe<ItemRevision<T>> =>
    useMemoSelector(selectItem<T>, [shareId, itemId]);

export const useOptimisticItem = <T extends ItemType = ItemType>(
    shareId: string,
    itemId: string
): Maybe<ItemRevisionWithOptimistic<T>> => useMemoSelector(selectItemWithOptimistic<T>, [shareId, itemId]);

export const useItemOptimisticState = (shareId: string, itemId: string): ItemOptimisticState =>
    useMemoSelector(selectOptimisticItemState, [shareId, itemId]);
