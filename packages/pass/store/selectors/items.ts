import { createSelector } from '@reduxjs/toolkit';

import { hasEmail, isActive, isItemType, isPinned, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { filterItemsByUserIdentifier, flattenItemsByShareId } from '@proton/pass/lib/items/item.utils';
import selectFailedAction from '@proton/pass/store/optimistic/selectors/select-failed-action';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import type { ItemsByShareId } from '@proton/pass/store/reducers/items';
import { withOptimisticItemsByShareId } from '@proton/pass/store/reducers/items';
import { SelectorError } from '@proton/pass/store/selectors/errors';
import { selectAllShareIds } from '@proton/pass/store/selectors/shares';
import type { State } from '@proton/pass/store/types';
import type {
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    Maybe,
    MaybeNull,
    SelectedItem,
} from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { and } from '@proton/pass/utils/fp/predicates';
import isTruthy from '@proton/utils/isTruthy';

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;

export const selectItemsState = (state: State) => state.items.byShareId;
export const selectOptimisticIds = (state: State) => state.items.byOptimisticId;
export const selectIsOptimisticId = (id: string) => createSelector(selectOptimisticIds, (ids) => id in ids);
export const selectItemDrafts = (state: State) => state.items.drafts;

export const selectNonFailedItems = createSelector(selectItemsState, asIfNotFailed);
export const selectNonOptimisticItems = createSelector(selectItemsState, asIfNotOptimistic);
export const selectItems = createSelector(selectItemsState, unwrapOptimisticState);
// Intentionally boring name to push for using visibility filter by default
export const selectAllIncludingHiddenItems = createSelector(selectItems, flattenItemsByShareId);
export const selectAllItems = createSelector([selectAllIncludingHiddenItems, selectAllShareIds], (items, shareIds) =>
    items.filter(({ shareId }) => shareIds.has(shareId))
);
export const selectTrashedItems = createSelector(selectAllItems, (items) => items.filter(isTrashed));
export const selectPinnedItems = createSelector(selectAllItems, (items) => items.filter(and(isActive, isPinned)));
export const selectLatestDraft = createSelector(selectItemDrafts, (drafts) => first(drafts));

export const selectItemsByType = <T extends ItemType>(type: T) =>
    createSelector(selectAllItems, (items) => items.filter(isItemType<T>(type)));

export const selectLoginItems = selectItemsByType('login');
export const selectAliasItems = selectItemsByType('alias');

export const itemsFromSelection =
    (selection: SelectedItem[]) =>
    (items: ItemsByShareId): ItemRevision[] =>
        selection.map(({ shareId, itemId }) => items?.[shareId]?.[itemId]).filter(isTruthy);

export const selectSelectedItems = (selection: SelectedItem[]) =>
    createSelector([selectItemsState], (items) => itemsFromSelection(selection)(items));

export const selectNonOptimisticItem =
    <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    (state: State) =>
        selectNonOptimisticItems(state)?.[shareId]?.[itemId] as Maybe<ItemRevision<T>>;

export const selectItem = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector([selectItems, selectOptimisticIds], (items, byOptimisticId): Maybe<ItemRevision<T>> => {
        const idFromOptimisticId = byOptimisticId[itemId]?.itemId;
        const byItemId = items[shareId];

        return (idFromOptimisticId
            ? byItemId?.[idFromOptimisticId]
            : byItemId?.[itemId]) satisfies Maybe<ItemRevision> as Maybe<ItemRevision<T>>;
    });

export const selectItemOrThrow = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector(selectItem<T>(shareId, itemId), (item) => {
        if (!item) throw new SelectorError(`Item ${itemId} not found`);
        return item;
    });

export const selectOptimisticItemState = (shareId: string, itemId: string) =>
    createSelector(
        [selectItem(shareId, itemId), selectNonFailedItems, selectNonOptimisticItems],
        (item, withoutFailed, withoutOptimistic) => {
            if (!item) return { failed: false, optimistic: false };
            return {
                failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
            };
        }
    );

export const selectOptimisticFailedAction = (entityID: string) =>
    createSelector([selectItemsState], selectFailedAction(entityID));

export const selectItemWithOptimistic = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector(
        [selectItem<T>(shareId, itemId), selectOptimisticItemState(shareId, itemId)],
        (item, { failed, optimistic }): Maybe<ItemRevisionWithOptimistic<T>> =>
            item ? { ...item, failed, optimistic } : undefined
    );

export const selectItemsByShareId = (shareId?: string) =>
    createSelector(selectItems, (items): ItemRevision[] =>
        flattenItemsByShareId(shareId && items[shareId] ? { [shareId]: items[shareId] } : items).filter(isActive)
    );

export const selectItemsByUserIdentifier = (userIdentifier: string) =>
    createSelector(selectLoginItems, filterItemsByUserIdentifier(userIdentifier));

export const selectItemsByEmail = (itemEmail?: MaybeNull<string>) =>
    createSelector(selectLoginItems, (items) => {
        if (!itemEmail) return;
        return items.find(hasEmail(itemEmail));
    });
