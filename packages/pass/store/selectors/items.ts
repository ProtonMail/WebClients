import { createSelector } from '@reduxjs/toolkit';

import type {
    Item,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    ItemsSortOption,
    Maybe,
    MaybeNull,
    Realm,
    UniqueItem,
} from '@proton/pass/types';
import { invert } from '@proton/pass/utils/fp';
import { isTrashed } from '@proton/pass/utils/pass/trash';
import { matchAny, matchLoginItemsByUrl } from '@proton/pass/utils/search';
import { parseUrl } from '@proton/pass/utils/url';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import { withOptimisticItemsByShareId } from '../reducers/items';
import type { State } from '../types';

const flattenItemsByShareId = (itemsByShareId: {
    [shareId: string]: { [itemId: string]: ItemRevision };
}): ItemRevision[] => Object.values(itemsByShareId).flatMap(Object.values);

export const selectByShareId = (state: State) => state.items.byShareId;
export const selectByOptimisticIds = (state: State) => state.items.byOptimistcId;
export const selectItems = createSelector([selectByShareId], unwrapOptimisticState);
export const selectAllItems = createSelector(selectItems, flattenItemsByShareId);
export const selectAllTrashedItems = createSelector([selectAllItems], (items) => items.filter(isTrashed));

export const selectItemsByShareId = createSelector(
    [selectItems, (_: State, shareId?: string) => shareId],
    (items, shareId) =>
        flattenItemsByShareId(shareId && items[shareId] ? { shareId: items[shareId] } : items).filter(invert(isTrashed))
);

export const selectItemIdByOptimisticId =
    (optimisticItemId?: string) =>
    (state: State): Maybe<UniqueItem> =>
        optimisticItemId ? selectByOptimisticIds(state)?.[optimisticItemId] : undefined;

export const selectItemByShareIdAndId = (shareId: string, itemId: string) =>
    createSelector([selectItems, selectByOptimisticIds], (items, byOptimisticId): Maybe<ItemRevision> => {
        const idFromOptimisticId = byOptimisticId[itemId]?.itemId;
        const byItemId = items[shareId];

        return idFromOptimisticId ? byItemId?.[idFromOptimisticId] : byItemId?.[itemId];
    });

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;
export const selectByShareIdAsIfNotFailed = createSelector(selectByShareId, asIfNotFailed);
export const selectByShareIdAsIfNotOptimistic = createSelector(selectByShareId, asIfNotOptimistic);

export const selectItemsWithOptimistic = createSelector(
    [selectAllItems, selectByShareIdAsIfNotFailed, selectByShareIdAsIfNotOptimistic],
    (items, withoutFailed, withoutOptimistic) => {
        return items.map(
            (item): ItemRevisionWithOptimistic => ({
                ...item,
                failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
            })
        );
    }
);

export const selectItemWithOptimistic = (shareId: string, itemId: string) =>
    createSelector(
        [selectItemByShareIdAndId(shareId, itemId), selectByShareIdAsIfNotFailed, selectByShareIdAsIfNotOptimistic],
        (item, withoutFailed, withoutOptimistic): Maybe<ItemRevisionWithOptimistic> =>
            item
                ? {
                      ...item,
                      failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                      optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
                  }
                : undefined
    );

/**
 * SEARCH SELECTORS
 * selectMatchItems : select all items by needle
 * selectAutofillCandidates : select login items by url
 */

export type MatchItemsSelectorOptions = {
    matchItem: (item: Item) => (searchTerm: string) => boolean;
    needle?: string;
    shareId?: string;
    sort?: ItemsSortOption;
    trash?: boolean;
};

export const selectItemsByType = <T extends ItemType>(type: T) =>
    createSelector(
        [selectAllItems, () => type],
        (items, type) => items.filter((item) => item.data.type === type) as ItemRevision<T>[]
    );

export const selectMatchItems = createSelector(
    [selectItemsWithOptimistic, (_: State, options: MatchItemsSelectorOptions) => options],
    (items, options) => {
        const { needle = '', shareId, sort = 'recent', trash = false, matchItem } = options;

        const itemsByShareId = items.filter(
            (item) => (!shareId || shareId === item.shareId) && (trash ? isTrashed(item) : !isTrashed(item))
        );

        const matchedItems =
            needle.trim() === '' ? itemsByShareId : itemsByShareId.filter((item) => matchItem(item.data)(needle));

        const sortedItems = matchedItems.sort((a, b) => {
            switch (sort) {
                case 'createTimeASC':
                    return a.createTime - b.createTime;
                case 'createTimeDESC':
                    return b.createTime - a.createTime;
                case 'recent':
                    return (
                        Math.max(b.lastUseTime ?? b.modifyTime, b.modifyTime) -
                        Math.max(a.lastUseTime ?? a.modifyTime, a.modifyTime)
                    );
                case 'titleASC':
                    return a.data.metadata.name.localeCompare(b.data.metadata.name);
            }
        });

        return {
            result: sortedItems,
            count: sortedItems.length,
            totalCount: itemsByShareId.length,
        };
    }
);

export const selectItemsByURL = (url?: MaybeNull<string>) =>
    createSelector(
        [selectItemsWithOptimistic, () => url],
        (items, url) =>
            (typeof url === 'string'
                ? items
                      .filter((item) => !isTrashed(item) && !item.optimistic && matchLoginItemsByUrl(item.data)(url))
                      .sort((a, b) => (b.lastUseTime ?? b.revisionTime) - (a.lastUseTime ?? a.revisionTime))
                : []) as ItemRevision<'login'>[]
    );

/**
 * Autofill candidates resolution strategy :
 *
 * If we have a match on the subdomain : return
 * the subdomain matches first, then the top-level
 * domain matches and finally the other sub-domain
 * matches excluding any previously matched direct
 * subdomain matches.
 *
 * If we have no subdomain : return all matches (top
 * level and other possible subdomain matches) with
 * top-level domain matches first
 */
export const selectAutofillCandidates = (realm?: Realm, subdomain?: MaybeNull<string>) =>
    createSelector([selectItemsByURL(realm), selectItemsByURL(subdomain)], (realmMatches, subdomainMatches) => [
        ...subdomainMatches,
        ...realmMatches
            .map((item) => {
                const urls = item.data.content.urls
                    .map((url) => {
                        const { isTopLevelDomain, domain } = parseUrl(url);
                        return isTopLevelDomain && domain ? domain : '';
                    })
                    .filter(Boolean);

                return { item, priority: matchAny(urls)(realm!) ? 0 : 1 };
            })
            .sort((a, b) => a.priority - b.priority)
            .map(({ item }) => item)
            .filter(({ itemId }) => !subdomainMatches.some((item) => item.itemId === itemId)),
    ]);

export const selectAutosaveCandidate = (username: string, realm: Realm, subdomain?: MaybeNull<string>) =>
    createSelector([selectItemsByURL(subdomain ?? realm), () => username], (items, username) =>
        items.filter(({ data }) => data.content.username === username)
    );
