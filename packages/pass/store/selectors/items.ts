import { createSelector } from '@reduxjs/toolkit';

import { isItemType, isPasskeyItem, isPinned, isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
import {
    filterItemsByShareId,
    filterItemsByType,
    flattenItemsByShareId,
    sortItems,
} from '@proton/pass/lib/items/item.utils';
import type { PasskeyQueryPayload, SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import { matchAny } from '@proton/pass/lib/search/match-any';
import { searchItems } from '@proton/pass/lib/search/match-items';
import { ItemUrlMatch, getItemPriorityForUrl } from '@proton/pass/lib/search/match-url';
import type {
    SelectAutofillCandidatesOptions,
    SelectAutosaveCandidatesOptions,
    SelectItemsByDomainOptions,
    SelectItemsOptions,
} from '@proton/pass/lib/search/types';
import { unwrapOptimisticState } from '@proton/pass/store/optimistic/utils/transformers';
import { withOptimisticItemsByShareId } from '@proton/pass/store/reducers/items';
import type { State } from '@proton/pass/store/types';
import type {
    BulkSelectionDTO,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    Maybe,
    MaybeNull,
    SelectedItem,
} from '@proton/pass/types';
import { deduplicate } from '@proton/pass/utils/array/duplicate';
import { first } from '@proton/pass/utils/array/first';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { invert, truthy } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { parseUrl } from '@proton/pass/utils/url/parser';
import isTruthy from '@proton/utils/isTruthy';

import { NOOP_LIST_SELECTOR } from './utils';

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;

export const selectItemsState = (state: State) => state.items.byShareId;
export const selectOptimisticIds = (state: State) => state.items.byOptimisticId;
export const selectIsOptimisticId = (id: string) => createSelector(selectOptimisticIds, (ids) => id in ids);
export const selectItemDrafts = (state: State) => state.items.drafts;
export const selectNonFailedItems = createSelector(selectItemsState, asIfNotFailed);
export const selectNonOptimisticItems = createSelector(selectItemsState, asIfNotOptimistic);
export const selectItems = createSelector(selectItemsState, unwrapOptimisticState);
export const selectAllItems = createSelector(selectItems, flattenItemsByShareId);
export const selectTrashedItems = createSelector(selectAllItems, (items) => items.filter(isTrashed));
export const selectPinnedItems = createSelector(selectAllItems, (items) => items.filter(isPinned));
export const selectLatestDraft = createSelector(selectItemDrafts, (drafts) => first(drafts));

export const selectItemsByType = <T extends ItemType>(type: T) =>
    createSelector(selectAllItems, (items) => items.filter(isItemType<T>(type)));

export const selectLoginItems = selectItemsByType('login');
export const selectAliasItems = selectItemsByType('alias');
export const selectNoteItems = selectItemsByType('note');
export const selectCCItems = selectItemsByType('creditCard');

export const selectBulkSelection = (dto: BulkSelectionDTO) =>
    createSelector(selectItemsState, (items) =>
        Object.entries(dto).flatMap(([shareId, itemIds]) =>
            Object.keys(itemIds).map((itemId) => items[shareId][itemId])
        )
    );

export const selectSelectedItems = (selection: SelectedItem[]) =>
    createSelector(selectItemsState, (items): ItemRevision[] =>
        selection.map(({ shareId, itemId }) => items?.[shareId]?.[itemId]).filter(isTruthy)
    );

export const selectItemsByShareId = (shareId?: string) =>
    createSelector(selectItems, (items): ItemRevision[] =>
        flattenItemsByShareId(shareId && items[shareId] ? { shareId: items[shareId] } : items).filter(invert(isTrashed))
    );

export const selectItem = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector([selectItems, selectOptimisticIds], (items, byOptimisticId): Maybe<ItemRevision<T>> => {
        const idFromOptimisticId = byOptimisticId[itemId]?.itemId;
        const byItemId = items[shareId];

        return (idFromOptimisticId
            ? byItemId?.[idFromOptimisticId]
            : byItemId?.[itemId]) satisfies Maybe<ItemRevision> as Maybe<ItemRevision<T>>;
    });

/** Unwraps the optimistic item state and hydrates the `failed` and
 * `optimistic` properties of the returned `ItemRevisionWithOptimistic` */
export const selectOptimisticItemsFactory = (selector: (state: State) => ItemRevision[]) =>
    createSelector(
        [selector, selectNonFailedItems, selectNonOptimisticItems],
        (items, withoutFailed, withoutOptimistic) =>
            items.map(
                (item): ItemRevisionWithOptimistic => ({
                    ...item,
                    failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                    optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
                })
            )
    );

export const selectItemsWithOptimistic = selectOptimisticItemsFactory(selectAllItems);

const selectSortedItemsByShareId = ({ trashed, shareId, sort }: SelectItemsOptions) =>
    createSelector(
        [selectItemsWithOptimistic, () => trashed, () => shareId, () => sort],
        (items, trashed, shareId, sort) =>
            pipe(
                filterItemsByShareId(shareId),
                sortItems(sort)
            )(items.filter((item) => (trashed ? isTrashed(item) : !isTrashed(item))))
    );

/** Search result selector is organized to separate sort from search, as sorting
 * can be computationally expensive when the number of items is high. The `search`
 * is expected to change more frequently than the shareId / sortOption */
export const selectItemsSearchResult = (options: SelectItemsOptions) =>
    createSelector(
        [selectSortedItemsByShareId(options), () => options.search, () => options.type],
        (byShareId, search, type) => {
            const searched = searchItems(byShareId, search);
            const filtered = filterItemsByType(type)(searched);
            return { filtered, searched, totalCount: byShareId.length };
        }
    );

export const selectItemWithOptimistic = (shareId: string, itemId: string) =>
    createSelector(
        [selectItem(shareId, itemId), selectNonFailedItems, selectNonOptimisticItems],
        (item, withoutFailed, withoutOptimistic): Maybe<ItemRevisionWithOptimistic> =>
            item
                ? {
                      ...item,
                      failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                      optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
                  }
                : undefined
    );

export const selectLoginItemByUsername = (username?: MaybeNull<string>) =>
    createSelector(selectLoginItems, (items) =>
        items.find((item) => deobfuscate(item.data.content.username) === username)
    );

export const selectItemsByDomain = (domain: MaybeNull<string>, options: SelectItemsByDomainOptions) =>
    typeof domain !== 'string' || isEmptyString(domain)
        ? NOOP_LIST_SELECTOR<ItemRevisionWithOptimistic<'login'>>
        : createSelector(
              [
                  selectItemsWithOptimistic,
                  () => domain,
                  () => options.protocol,
                  () => options.isPrivate,
                  () => options.shareIds,
                  () => options.sortOn ?? 'lastUseTime',
              ],
              (items, domain, protocol, isPrivate, shareIds, sortOn) =>
                  items
                      .reduce<{ item: ItemRevisionWithOptimistic<'login'>; priority: ItemUrlMatch }[]>(
                          (matches, item) => {
                              if (isItemType('login')(item) && !isTrashed(item)) {
                                  const validShareIds = !shareIds || shareIds.includes(item.shareId);
                                  const validItem = !item.optimistic;
                                  const validUrls = matchAny(item.data.content.urls)(domain);

                                  /* If the item does not pass this initial "fuzzy" test, then we
                                   * should not even consider it as an autofill candidate.
                                   * This avoids unnecessarily parsing items' URLs with 'tldts' */
                                  if (!(validShareIds && validItem && validUrls)) return matches;

                                  /* `getItemPriorityForUrl` will apply strict domain matching */
                                  const { data } = item as ItemRevisionWithOptimistic<'login'>;
                                  const priority = getItemPriorityForUrl(data)(domain, {
                                      protocolFilter: [protocol].filter(truthy),
                                      isPrivate,
                                  });

                                  /* if negative priority : this item does not match the criteria */
                                  if (priority === ItemUrlMatch.NO_MATCH) return matches;

                                  matches.push({ item, priority });
                              }
                              return matches;
                          },
                          []
                      )
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
                      .map(prop('item')) as ItemRevisionWithOptimistic<'login'>[]
          );

/** Autofill candidates resolution strategy : If we have a match on the subdomain :
 * return the subdomain matches first, then the top-level domain matches and finally
 * the other subdomain matches excluding any previously matched direct subdomain matches.
 * If we have no subdomain : return all matches (top level and other possible subdomain
 * matches) with top-level domain matches first. Pushes subdomain matches on top */
export const selectAutofillCandidates = (options: SelectAutofillCandidatesOptions) => {
    const { domain, subdomain, isPrivate, isSecure, shareIds } = options;
    const protocol = !isSecure && options.protocol ? options.protocol : null;

    return domain === null
        ? NOOP_LIST_SELECTOR<ItemRevisionWithOptimistic<'login'>>
        : createSelector(
              [
                  selectItemsByDomain(domain, { protocol, isPrivate, shareIds, sortOn: 'priority' }),
                  selectItemsByDomain(subdomain, { protocol, isPrivate, shareIds, sortOn: 'lastUseTime' }),
              ],
              (domainMatches, subdomainMatches) => deduplicate(subdomainMatches.concat(domainMatches), itemEq)
          );
};

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) =>
    createSelector(
        [
            selectItemsByDomain(options.subdomain, { protocol: null, isPrivate: false }),
            selectItemsByDomain(options.domain, { protocol: null, isPrivate: false }),
            () => options.username,
        ],
        (subdomainItems, domainItems, username) => {
            const candidates = deduplicate(subdomainItems.concat(domainItems), itemEq);
            if (!username) return candidates;
            return candidates.filter(({ data }) => deobfuscate(data.content.username) === username);
        }
    );

export const selectPasskeys = (payload: PasskeyQueryPayload) =>
    createSelector(selectAllItems, (items): SelectedPasskey[] => {
        const { credentialIds } = payload;
        const { domain } = parseUrl(payload.domain);

        return domain
            ? items
                  .filter((item): item is ItemRevision<'login'> => !isTrashed(item) && isPasskeyItem(item.data))
                  .flatMap((item) =>
                      (item.data.content.passkeys ?? [])
                          .filter((passkey) => {
                              const passkeyDomain = parseUrl(passkey.domain).domain;

                              return (
                                  passkeyDomain &&
                                  domain === passkeyDomain &&
                                  (credentialIds.length === 0 || credentialIds.includes(passkey.credentialId))
                              );
                          })
                          .map((passkey) => ({
                              credentialId: passkey.credentialId,
                              itemId: item.itemId,
                              name: item.data.metadata.name,
                              shareId: item.shareId,
                              username: passkey.userName,
                          }))
                  )
            : [];
    });
