import { createSelector } from '@reduxjs/toolkit';

import type {
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    Maybe,
    MaybeNull,
    UniqueItem,
} from '@proton/pass/types';
import { invert, pipe, prop } from '@proton/pass/utils/fp';
import { flattenItemsByShareId, isLoginItem } from '@proton/pass/utils/pass/items';
import { isTrashed } from '@proton/pass/utils/pass/trash';
import type {
    SelectAutofillCandidatesOptions,
    SelectAutosaveCandidatesOptions,
    SelectItemsByDomainOptions,
    SelectItemsOptions,
} from '@proton/pass/utils/search';
import {
    ItemUrlMatch,
    filterItemsByShareId,
    filterItemsByType,
    getItemPriorityForUrl,
    matchAny,
    searchItems,
    sortItems,
} from '@proton/pass/utils/search';
import { isEmptyString } from '@proton/pass/utils/string';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import { withOptimisticItemsByShareId } from '../reducers/items';
import type { State } from '../types';

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;
export const selectByShareId = (state: State) => state.items.byShareId;
export const selectByOptimisticIds = (state: State) => state.items.byOptimistcId;
export const selectItemDraft = (state: State) => state.popup.draft;

export const selectByShareIdAsIfNotFailed = createSelector(selectByShareId, asIfNotFailed);
export const selectByShareIdAsIfNotOptimistic = createSelector(selectByShareId, asIfNotOptimistic);
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

const selectItemsWithOptimisticFactory = ({ trash }: { trash: boolean }) =>
    createSelector(
        [selectAllItems, selectByShareIdAsIfNotFailed, selectByShareIdAsIfNotOptimistic],
        (items, withoutFailed, withoutOptimistic) => {
            return items
                .filter((item) => (trash ? isTrashed(item) : !isTrashed(item)))
                .map(
                    (item): ItemRevisionWithOptimistic => ({
                        ...item,
                        failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                        optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
                    })
                );
        }
    );

export const selectItemsWithOptimistic = selectItemsWithOptimisticFactory({ trash: false });
export const selectTrashItemsWithOptimistic = selectItemsWithOptimisticFactory({ trash: true });

/* Selectors organized to separate sort from search, as sorting can be computationally
 * expensive when the number of items is high. The search is expected to change more
 * frequently than the shareId / sortOption */
const selectSortedItemsByType = createSelector(
    [
        selectItemsWithOptimistic,
        (_state: State, { shareId }: SelectItemsOptions) => shareId,
        (_state: State, { sort }: SelectItemsOptions) => sort,
    ],
    (items, shareId, sort) => pipe(filterItemsByShareId(shareId), sortItems(sort))(items)
);

const itemsSearchResultSelector = createSelector(
    [
        selectSortedItemsByType,
        (_state: State, { search }: SelectItemsOptions) => search,
        (_state: State, { itemType }: SelectItemsOptions) => itemType,
    ],
    (byShareId, search, itemType) => {
        const searched = searchItems(byShareId, search);
        const filtered = filterItemsByType(itemType)(searched);
        return { filtered, searched, totalCount: byShareId.length };
    }
);

export const selectItemsSearchResult = (options: SelectItemsOptions) => (state: State) =>
    itemsSearchResultSelector(state, options);

const trashedItemsSearchResultSelector = createSelector(
    [selectTrashItemsWithOptimistic, (_state: State, search?: string) => search],
    (items, search) => {
        const searched = searchItems(items, search);
        return { searched, totalCount: items.length };
    }
);

export const selectTrashedItemsSearchResults = (search?: string) => (state: State) =>
    trashedItemsSearchResultSelector(state, search);

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

const selectItemsByTypeSelector = createSelector([selectAllItems, (_: State, type: ItemType) => type], (items, type) =>
    items.filter((item) => item.data.type === type)
);

export const selectItemsByType =
    <T extends ItemType>(type: T) =>
    (state: State) =>
        selectItemsByTypeSelector(state, type) as ItemRevision<T>[];

const loginItemByUsernameSelector = createSelector(
    [selectItemsByType('login'), (_: State, username?: MaybeNull<string>) => username],
    (loginItems, _username) => loginItems.find((item) => item.data.content.username === _username)
);

export const selectLoginItemByUsername = (username?: MaybeNull<string>) => (state: State) =>
    loginItemByUsernameSelector(state, username);

const itemsByDomainSelector = createSelector(
    [
        selectItemsWithOptimistic,
        (_state: State, domain: MaybeNull<string>) => domain,
        (_state: State, _: MaybeNull<string>, { protocolFilter }: SelectItemsByDomainOptions) => protocolFilter,
        (_state: State, _: MaybeNull<string>, { isPrivate }: SelectItemsByDomainOptions) => isPrivate,
        (_state: State, _: MaybeNull<string>, { shareId }: SelectItemsByDomainOptions) => shareId,
        (_state: State, _: MaybeNull<string>, { sortOn }: SelectItemsByDomainOptions) => sortOn ?? 'lastUseTime',
    ],
    (items, domain, protocolFilter, isPrivate, shareId, sortOn) =>
        (typeof domain === 'string' && !isEmptyString(domain)
            ? items
                  .reduce<{ item: ItemRevisionWithOptimistic; priority: ItemUrlMatch }[]>((matches, item) => {
                      const validShareId = !shareId || shareId === item.shareId;
                      const validItem = !item.optimistic;
                      const validUrls = isLoginItem(item.data) && matchAny(item.data.content.urls)(domain);

                      /* If the item does not pass this initial "fuzzy" test, then we
                       * should not even consider it as an autofill candidate.
                       * This avoids unnecessarily parsing items' URLs with 'tldts' */
                      if (!(validShareId && validItem && validUrls)) return matches;

                      /* `getItemPriorityForUrl` will apply strict domain matching */
                      const { data } = item as ItemRevisionWithOptimistic<'login'>;
                      const priority = getItemPriorityForUrl(data)(domain, { protocolFilter, isPrivate });

                      /* if negative priority : this item does not match the criteria */
                      if (priority === ItemUrlMatch.NO_MATCH) return matches;

                      matches.push({ item, priority });
                      return matches;
                  }, [])
                  .sort((a, b) => {
                      const aPrio = a.priority;
                      const bPrio = b.priority;

                      const aTime = a.item.lastUseTime ?? a.item.revisionTime;
                      const bTime = b.item.lastUseTime ?? b.item.revisionTime;

                      /* if we have a priority tie
                       * fallback to time comparison */
                      switch (sortOn) {
                          case 'priority':
                              return aPrio > 0 && aPrio === bPrio ? bTime - aTime : bPrio - aPrio;
                          case 'lastUseTime':
                              return bTime - aTime;
                      }
                  })
                  .map(prop('item'))
            : []) as ItemRevisionWithOptimistic<'login'>[]
);

export const selectItemsByDomain = (domain: MaybeNull<string>, options: SelectItemsByDomainOptions) => (state: State) =>
    itemsByDomainSelector(state, domain, options);

/* Autofill candidates resolution strategy :
 *
 * If we have a match on the subdomain : return
 * the subdomain matches first, then the top-level
 * domain matches and finally the other sub-domain
 * matches excluding any previously matched direct
 * subdomain matches.
 *
 * If we have no subdomain : return all matches (top
 * level and other possible subdomain matches) with
 * top-level domain matches first */
const autofillCandidatesSelector = createSelector(
    [
        (state: State, { domain, isSecure, isPrivate, shareId, protocol }: SelectAutofillCandidatesOptions) =>
            selectItemsByDomain(domain, {
                protocolFilter: !isSecure && protocol ? [protocol] : [],
                isPrivate,
                shareId,
                sortOn: 'priority',
            })(state),
        (state: State, { subdomain, isSecure, isPrivate, shareId, protocol }: SelectAutofillCandidatesOptions) =>
            selectItemsByDomain(subdomain, {
                protocolFilter: !isSecure && protocol ? [protocol] : [],
                isPrivate,
                shareId,
                sortOn: 'lastUseTime',
            })(state),
    ],
    (domainMatches, subdomainMatches) => [
        ...subdomainMatches /* push subdomain matches on top */,
        ...domainMatches.filter(({ itemId }) => !subdomainMatches.some((item) => item.itemId === itemId)),
    ]
);

export const selectAutofillCandidates = (options: SelectAutofillCandidatesOptions) => (state: State) => {
    /* if the protocol is null : it likely means the
     * url validation failed - do not return any candidates */
    if (options.protocol === null || options.domain === null) return [];
    return autofillCandidatesSelector(state, options);
};

const autosaveCandidateSelector = createSelector(
    [
        (state: State, { subdomain, domain }: SelectAutosaveCandidatesOptions) =>
            selectItemsByDomain(subdomain ?? domain, {
                protocolFilter: [],
                isPrivate: false,
            })(state),
        (_: State, { username }: SelectAutosaveCandidatesOptions) => username,
    ],
    (items, username) => items.filter(({ data }) => data.content.username === username)
);

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) => (state: State) =>
    autosaveCandidateSelector(state, options);
