import { createSelector } from '@reduxjs/toolkit';

import { isLoginItem, isPasskeyItem, isPinned, isTrashed, itemEq } from '@proton/pass/lib/items/item.predicates';
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
import type {
    BulkSelectionDTO,
    ItemRevision,
    ItemRevisionWithOptimistic,
    ItemType,
    Maybe,
    MaybeNull,
    UniqueItem,
} from '@proton/pass/types';
import { deduplicate } from '@proton/pass/utils/array/duplicate';
import { first } from '@proton/pass/utils/array/first';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { invert, truthy } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import { withOptimisticItemsByShareId } from '../reducers/items';
import type { State } from '../types';

const { asIfNotFailed, asIfNotOptimistic } = withOptimisticItemsByShareId.selectors;
export const selectByShareId = (state: State) => state.items.byShareId;
export const selectByOptimisticIds = (state: State) => state.items.byOptimisticId;

export const selectItemDrafts = (state: State) => state.items.drafts;
export const selectLatestDraft = createSelector(selectItemDrafts, (drafts) => first(drafts));

/** Given an itemId, returns wether it is optimistic by checking for
 * presence in the `byOptimisticId` dictionary state */
export const selectResolvedOptimisticId = (optimisticId: string) =>
    createSelector(selectByOptimisticIds, (optimisticIds) => optimisticId in optimisticIds);

export const selectItemsFromBulkSelectionDTO = (dto: BulkSelectionDTO) => (state: State) =>
    Object.entries(dto).flatMap(([shareId, itemIds]) =>
        Object.keys(itemIds).map((itemId) => state.items.byShareId[shareId][itemId])
    );

export const selectByShareIdAsIfNotFailed = createSelector(selectByShareId, asIfNotFailed);
export const selectByShareIdAsIfNotOptimistic = createSelector(selectByShareId, asIfNotOptimistic);
export const selectItems = createSelector([selectByShareId], unwrapOptimisticState);
export const selectAllItems = createSelector(selectItems, flattenItemsByShareId);
export const selectAllTrashedItems = createSelector([selectAllItems], (items) => items.filter(isTrashed));
export const selectPinnedItems = createSelector([selectAllItems], (items) => items.filter(isPinned));

export const selectItemsByShareId = (shareId?: string) =>
    createSelector([selectItems, () => shareId], (items, shareId): ItemRevision[] =>
        flattenItemsByShareId(shareId && items[shareId] ? { shareId: items[shareId] } : items).filter(invert(isTrashed))
    );

export const selectItemIdByOptimisticId =
    (optimisticItemId?: string) =>
    (state: State): Maybe<UniqueItem> =>
        optimisticItemId ? selectByOptimisticIds(state)?.[optimisticItemId] : undefined;

export const selectItemByShareIdAndId = <T extends ItemType = ItemType>(shareId: string, itemId: string) =>
    createSelector([selectItems, selectByOptimisticIds], (items, byOptimisticId): Maybe<ItemRevision<T>> => {
        const idFromOptimisticId = byOptimisticId[itemId]?.itemId;
        const byItemId = items[shareId];

        return (idFromOptimisticId
            ? byItemId?.[idFromOptimisticId]
            : byItemId?.[itemId]) satisfies Maybe<ItemRevision> as Maybe<ItemRevision<T>>;
    });

/** Unwraps the optimistic item state and hydrates the `failed` and
 * `optimistic` properties of the returned `ItemRevisionWithOptimistic` */
const selectItemsWithOptimistic = createSelector(
    [selectAllItems, selectByShareIdAsIfNotFailed, selectByShareIdAsIfNotOptimistic],
    (items, withoutFailed, withoutOptimistic) =>
        items.map(
            (item): ItemRevisionWithOptimistic => ({
                ...item,
                failed: withoutFailed[item.shareId]?.[item.itemId]?.revision !== item.revision,
                optimistic: withoutOptimistic[item.shareId]?.[item.itemId]?.revision !== item.revision,
            })
        )
);

const selectSortedItemsByShareId = createSelector(
    [
        selectItemsWithOptimistic,
        (_: State, { trashed }: SelectItemsOptions) => trashed ?? false,
        (_: State, { shareId }: SelectItemsOptions) => shareId,
        (_: State, { sort }: SelectItemsOptions) => sort,
    ],
    (items, trashed, shareId, sort) =>
        pipe(
            filterItemsByShareId(shareId),
            sortItems(sort)
        )(items.filter((item) => (trashed ? isTrashed(item) : !isTrashed(item))))
);

/** Search result selector is organized to separate sort from search, as sorting can
 * be computationally expensive when the number of items is high. The `search` is expected
 * to change more frequently than the shareId / sortOption */
const itemsSearchResultSelector = createSelector(
    [
        selectSortedItemsByShareId,
        (_state: State, { search }: SelectItemsOptions) => search,
        (_state: State, { type }: SelectItemsOptions) => type,
    ],
    (byShareId, search, type) => {
        const searched = searchItems(byShareId, search);
        const filtered = filterItemsByType(type)(searched);
        return { filtered, searched, totalCount: byShareId.length };
    }
);

export const selectItemsSearchResult = (options: SelectItemsOptions) => (state: State) =>
    itemsSearchResultSelector(state, options);

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
    (loginItems, _username) => loginItems.find((item) => deobfuscate(item.data.content.username) === _username)
);

export const selectLoginItemByUsername = (username?: MaybeNull<string>) => (state: State) =>
    loginItemByUsernameSelector(state, username);

const itemsByDomainSelector = createSelector(
    [
        selectItemsWithOptimistic,
        (_state: State, domain: MaybeNull<string>) => domain,
        (_state: State, _: MaybeNull<string>, { protocol }: SelectItemsByDomainOptions) => protocol,
        (_state: State, _: MaybeNull<string>, { isPrivate }: SelectItemsByDomainOptions) => isPrivate,
        (_state: State, _: MaybeNull<string>, { shareIds }: SelectItemsByDomainOptions) => shareIds,
        (_state: State, _: MaybeNull<string>, { sortOn }: SelectItemsByDomainOptions) => sortOn ?? 'lastUseTime',
    ],
    (items, domain, protocol, isPrivate, shareIds, sortOn) =>
        (typeof domain === 'string' && !isEmptyString(domain)
            ? items
                  .filter(invert(isTrashed))
                  .reduce<{ item: ItemRevisionWithOptimistic; priority: ItemUrlMatch }[]>((matches, item) => {
                      const validShareIds = !shareIds || shareIds.includes(item.shareId);
                      const validItem = !item.optimistic;
                      const validUrls = isLoginItem(item.data) && matchAny(item.data.content.urls)(domain);

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
        (state: State, { domain, isSecure, isPrivate, shareIds, protocol }: SelectAutofillCandidatesOptions) =>
            selectItemsByDomain(domain, {
                protocol: !isSecure && protocol ? protocol : null,
                isPrivate,
                shareIds,
                sortOn: 'priority',
            })(state),
        (state: State, { subdomain, isSecure, isPrivate, shareIds, protocol }: SelectAutofillCandidatesOptions) =>
            selectItemsByDomain(subdomain, {
                protocol: !isSecure && protocol ? protocol : null,
                isPrivate,
                shareIds,
                sortOn: 'lastUseTime',
            })(state),
    ],
    /* push subdomain matches on top */
    (domainMatches, subdomainMatches) => deduplicate(subdomainMatches.concat(domainMatches), itemEq)
);

export const selectAutofillCandidates = (options: SelectAutofillCandidatesOptions) => (state: State) => {
    /* if the protocol is null : it likely means the
     * URL validation failed - do not return any candidates */
    if (options.protocol === null || options.domain === null) return [];
    return autofillCandidatesSelector(state, options);
};

const autosaveCandidateSelector = createSelector(
    [
        (state: State, { subdomain }: SelectAutosaveCandidatesOptions) =>
            selectItemsByDomain(subdomain, { protocol: null, isPrivate: false })(state),
        (state: State, { domain }: SelectAutosaveCandidatesOptions) =>
            selectItemsByDomain(domain, { protocol: null, isPrivate: false })(state),
        (_: State, { username }: SelectAutosaveCandidatesOptions) => username,
    ],
    (subdomainItems, domainItems, username) =>
        deduplicate(subdomainItems.concat(domainItems), itemEq).filter(
            ({ data }) => deobfuscate(data.content.username) === username
        )
);

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) => (state: State) =>
    autosaveCandidateSelector(state, options);

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
