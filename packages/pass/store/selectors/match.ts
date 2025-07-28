import { createSelector } from '@reduxjs/toolkit';

import { isActive, isItemType, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { filterItemsByShareId, filterItemsByType, sortItems } from '@proton/pass/lib/items/item.utils';
import { searchItems } from '@proton/pass/lib/search/match-items';
import { ItemUrlMatch, getItemPriorityForUrl } from '@proton/pass/lib/search/match-url';
import type { SelectItemsByDomainOptions, SelectItemsOptions } from '@proton/pass/lib/search/types';
import { itemsFromSelection, selectAllVisibleItems, selectItems } from '@proton/pass/store/selectors/items';
import { selectSecureLinks } from '@proton/pass/store/selectors/secure-links';
import { selectSharedByMe, selectSharedWithMe } from '@proton/pass/store/selectors/shared';
import { NOOP_LIST_SELECTOR, createUncachedSelector } from '@proton/pass/store/selectors/utils';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision, MaybeNull, SelectedItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

export type ItemsSearchResults = {
    filtered: ItemRevision[];
    searched: ItemRevision[];
    totalCount: number;
};

const selectTrashedFilter = (_: State, { trashed }: SelectItemsOptions) => trashed;
const selectShareIdFilter = (_: State, { shareId }: SelectItemsOptions) => shareId;
const selectSortFilter = (_: State, { sort }: SelectItemsOptions) => sort;
const selectSearchFilter = (_: State, { search }: SelectItemsOptions) => search;
const selectTypeFilter = (_: State, { type }: SelectItemsOptions) => type;

/** Search result selector is organized to separate sort from search, as sorting
 * can be computationally expensive when the number of items is high. The `search`
 * is expected to change more frequently than the shareId / sortOption */
export const createMatchItemsSelector = () => {
    const selectSortedItemsByShareId = createSelector(
        [selectAllVisibleItems, selectTrashedFilter, selectShareIdFilter, selectSortFilter],
        (items, trashed, shareId, sort) =>
            pipe(filterItemsByShareId(shareId), sortItems(sort))(items.filter(trashed ? isTrashed : isActive))
    );

    return createSelector(
        [selectSortedItemsByShareId, selectSearchFilter, selectTypeFilter],
        (items, search, type): ItemsSearchResults => {
            const searched = searchItems(items, search);
            const filtered = filterItemsByType(type)(searched);
            return { filtered, searched, totalCount: items.length };
        }
    );
};

export const createMatchSharedByMeSelector = () =>
    createSelector([selectSharedByMe, selectSearchFilter], (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    });

export const createMatchSharedWithMeSelector = () =>
    createSelector([selectSharedWithMe, selectSearchFilter], (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    });

export const createMatchSecureLinksSelector = () => {
    const selectSortedSecureLinkItems = createSelector([selectItems, selectSecureLinks], (items, secureLinks) => {
        const { totalCount, selection } = Object.entries(secureLinks).reduce(
            (acc, [shareId, byShareId]) => {
                Object.entries(byShareId).forEach(([itemId, { length }]) => {
                    acc.totalCount += length;
                    if (length > 0) acc.selection.push({ shareId, itemId });
                });

                return acc;
            },
            { totalCount: 0, selection: <SelectedItem[]>[] }
        );

        const secureLinkItems = itemsFromSelection(selection)(items);
        const sorted = sortItems('recent')(secureLinkItems);
        return { sorted, totalCount };
    });

    return createSelector(
        [selectSortedSecureLinkItems, selectSearchFilter],
        ({ sorted, totalCount }, search): ItemsSearchResults => {
            const searched = searchItems(sorted, search);
            return { searched, filtered: searched, totalCount };
        }
    );
};

export const createMatchDomainItemsSelector = (domain: MaybeNull<string>, options: SelectItemsByDomainOptions) =>
    typeof domain !== 'string' || isEmptyString(domain)
        ? NOOP_LIST_SELECTOR<ItemRevision<'login'>>
        : createUncachedSelector(
              [
                  selectAllVisibleItems,
                  () => domain,
                  () => options.protocol,
                  () => options.port,
                  () => options.isPrivate,
                  () => options.shareIds,
                  () => options.sortOn ?? 'lastUseTime',
                  () => options.strict,
              ],
              (items, domain, protocol, port, isPrivate, shareIds, sortOn, strict) =>
                  items
                      .reduce<{ item: ItemRevision<'login'>; priority: ItemUrlMatch }[]>((matches, item) => {
                          if (isItemType('login')(item) && isActive(item)) {
                              const validShareIds = !shareIds || shareIds.includes(item.shareId);
                              const validUrls = item.data.content.urls.some((url) => url.includes(domain));

                              /* If the item does not pass this initial "fuzzy" test, then we
                               * should not even consider it as an autofill candidate.
                               * This avoids unnecessarily parsing items' URLs with 'tldts' */
                              if (!(validShareIds && validUrls)) return matches;

                              /* `getItemPriorityForUrl` will apply strict domain matching */
                              const { data } = item;
                              const priority = getItemPriorityForUrl(data)(domain, {
                                  isPrivate,
                                  protocol,
                                  strict,
                                  port,
                              });

                              /* if negative priority : this item does not match the criteria */
                              if (priority === ItemUrlMatch.NO_MATCH) return matches;

                              matches.push({ item, priority });
                          }
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
          );
