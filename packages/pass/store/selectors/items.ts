import { createSelector } from '@reduxjs/toolkit';

import isTruthy from '@proton/utils/isTruthy';

import { hasEmail, isActive, isItemType, isPinned, isTrashed } from '../../lib/items/item.predicates';
import { filterItemsByUserIdentifier, flattenItemsByShareId, sortItems } from '../../lib/items/item.utils';
import type { ItemRevision, ItemRevisionWithOptimistic, ItemSortFilter, ItemType, Maybe, MaybeNull, SelectedItem } from '../../types';
import { first } from '../../utils/array/first';
import { and, not } from '../../utils/fp/predicates';
import selectFailedAction from '../optimistic/selectors/select-failed-action';
import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import type { ItemsByShareId } from '../reducers/items';
import { withOptimisticItemsByShareId } from '../reducers/items';
import type { State } from '../types';
import { SelectorError } from './errors';
import { createVisibilityFilterSelector } from './shares';
import { createUncachedSelector } from './utils';

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;

export const selectItemsState = (state: State) => state.items.byShareId;
export const selectOptimisticIds = (state: State) => state.items.byOptimisticId;
export const selectIsOptimisticId = (id: string) => createSelector(selectOptimisticIds, (ids) => id in ids);
export const selectItemDrafts = (state: State) => state.items.drafts;

export const selectNonFailedItems = createSelector(selectItemsState, asIfNotFailed);
export const selectNonOptimisticItems = createSelector(selectItemsState, asIfNotOptimistic);
export const selectItems = createSelector(selectItemsState, unwrapOptimisticState);
export const selectAllItems = createSelector(selectItems, flattenItemsByShareId);
export const selectVisibleItems = createVisibilityFilterSelector(selectAllItems);

export const selectTrashedItems = createSelector(selectVisibleItems, (items) => items.filter(isTrashed));
export const selectPinnedItems = createSelector(selectVisibleItems, (items) => items.filter(and(isActive, isPinned)));
export const selectLatestDraft = createSelector(selectItemDrafts, (drafts) => first(drafts));

export const selectItemsFactory = <T extends ItemType>(type: T, visibleOnly: boolean) =>
    createSelector(visibleOnly ? selectVisibleItems : selectAllItems, (items) => items.filter(isItemType<T>(type)));

export const selectAllLoginItems = selectItemsFactory('login', false);
export const selectVisibleLoginItems = selectItemsFactory('login', true);

export const selectAllAliasItems = selectItemsFactory('alias', false);
export const selectVisibleAliasItems = selectItemsFactory('alias', true);

export const selectVisibleNonTrashedSshKeyItems = createSelector(selectItemsFactory('sshKey', true), (items) =>
    items.filter(not(isTrashed))
);

export const itemsFromSelection =
    (selection: SelectedItem[]) =>
    (items: ItemsByShareId): ItemRevision[] =>
        selection.map(({ shareId, itemId }) => items?.[shareId]?.[itemId]).filter(isTruthy);

export const selectSelectedItems = (selection: SelectedItem[], sortOn?: ItemSortFilter) =>
    createSelector([selectItemsState], (items): ItemRevision[] => {
        const result = itemsFromSelection(selection)(items);
        return sortOn ? sortItems(sortOn)(result) : result;
    });

export const selectSelectedItemGroups = (groups: SelectedItem[][], sortOn?: ItemSortFilter) =>
    createSelector(
        groups.map((group) => selectSelectedItems(group, sortOn)),
        (...res): ItemRevision[][] => res
    );

export const selectNonOptimisticItem =
    <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    (state: State) =>
        selectNonOptimisticItems(state)?.[shareId]?.[itemId] as Maybe<ItemRevision<T>>;

export const selectItem = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector([selectItems, selectOptimisticIds], (items, byOptimisticId): Maybe<ItemRevision<T>> => {
        const idFromOptimisticId = byOptimisticId[itemId]?.itemId;
        const byItemId = items[shareId];

        return (idFromOptimisticId ? byItemId?.[idFromOptimisticId] : byItemId?.[itemId]) satisfies Maybe<ItemRevision> as Maybe<
            ItemRevision<T>
        >;
    });

export const selectItemOrThrow = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createUncachedSelector(selectItem<T>(shareId, itemId), (item) => {
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

export const selectOptimisticFailedAction = (entityID: string) => createSelector([selectItemsState], selectFailedAction(entityID));

export const selectItemWithOptimistic = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector(
        [selectItem<T>(shareId, itemId), selectOptimisticItemState(shareId, itemId)],
        (item, { failed, optimistic }): Maybe<ItemRevisionWithOptimistic<T>> => (item ? { ...item, failed, optimistic } : undefined)
    );

export const selectItemsByShareId = (shareId?: string) =>
    createSelector(selectItems, (items): ItemRevision[] =>
        flattenItemsByShareId(shareId && items[shareId] ? { [shareId]: items[shareId] } : items).filter(isActive)
    );

export const selectItemsByUserIdentifier = (userIdentifier: string) =>
    createSelector(selectVisibleLoginItems, filterItemsByUserIdentifier(userIdentifier));

export const selectItemsByEmail = (itemEmail?: MaybeNull<string>) =>
    createSelector(selectVisibleLoginItems, (items) => {
        if (!itemEmail) return;
        return items.find(hasEmail(itemEmail));
    });
