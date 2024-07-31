import { createSelector } from '@reduxjs/toolkit';

import {
    belongsToShares,
    hasEmail,
    hasOTP,
    hasUserIdentifier,
    isActive,
    isItemType,
    isPasskeyItem,
    isPinned,
    isTrashed,
    itemEq,
} from '@proton/pass/lib/items/item.predicates';
import {
    filterItemsByShareId,
    filterItemsByType,
    filterItemsByUserIdentifier,
    flattenItemsByShareId,
    sortItems,
} from '@proton/pass/lib/items/item.utils';
import type { PasskeyQueryPayload, SelectedPasskey } from '@proton/pass/lib/passkeys/types';
import { searchItems } from '@proton/pass/lib/search/match-items';
import { ItemUrlMatch, getItemPriorityForUrl } from '@proton/pass/lib/search/match-url';
import type {
    SelectAutofillCandidatesOptions,
    SelectAutosaveCandidatesOptions,
    SelectItemsByDomainOptions,
    SelectItemsOptions,
    SelectOTPAutofillCandidateOptions,
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
    SecureLink,
    SelectedItem,
} from '@proton/pass/types';
import { deduplicate } from '@proton/pass/utils/array/duplicate';
import { first } from '@proton/pass/utils/array/first';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { and, not, truthy } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';
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
export const selectSecureLinks = (state: State) => state.items.secureLinks;
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
export const selectIdentityItems = selectItemsByType('identity');

/** Filters out all login items which were created from an alias item */
export const selectNonAliasedLoginItems = createSelector([selectLoginItems, selectAliasItems], (logins, aliases) => {
    const aliasEmails = new Set<string>(aliases.map(prop('aliasEmail')).filter(isTruthy));
    return logins.filter((item) => isActive(item) && !aliasEmails.has(deobfuscate(item.data.content.itemEmail)));
});

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
        flattenItemsByShareId(shareId && items[shareId] ? { [shareId]: items[shareId] } : items).filter(isActive)
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
            pipe(filterItemsByShareId(shareId), sortItems(sort))(items.filter(trashed ? isTrashed : isActive))
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

export const selectLoginsByUserIdentifier = (itemEmail: string) =>
    createSelector(selectLoginItems, filterItemsByUserIdentifier(itemEmail));

export const selectLoginItemByEmail = (itemEmail?: MaybeNull<string>) =>
    createSelector(selectLoginItems, (items) => {
        if (!itemEmail) return;
        return items.find(hasEmail(itemEmail));
    });

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
                  () => options.strict,
              ],
              (items, domain, protocol, isPrivate, shareIds, sortOn, strict) =>
                  items
                      .reduce<{ item: ItemRevisionWithOptimistic<'login'>; priority: ItemUrlMatch }[]>(
                          (matches, item) => {
                              if (isItemType('login')(item) && isActive(item)) {
                                  const validShareIds = !shareIds || shareIds.includes(item.shareId);
                                  const validItem = !item.optimistic;
                                  const validUrls = item.data.content.urls.some((url) => url.includes(domain));

                                  /* If the item does not pass this initial "fuzzy" test, then we
                                   * should not even consider it as an autofill candidate.
                                   * This avoids unnecessarily parsing items' URLs with 'tldts' */
                                  if (!(validShareIds && validItem && validUrls)) return matches;

                                  /* `getItemPriorityForUrl` will apply strict domain matching */
                                  const { data } = item;
                                  const priority = getItemPriorityForUrl(data)(domain, {
                                      protocolFilter: [protocol].filter(truthy),
                                      isPrivate,
                                      strict,
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
                      .map(prop('item'))
          );

/** Autofill candidates resolution strategy : If we have a match on the subdomain :
 * return the subdomain matches first, then the top-level domain matches and finally
 * the other subdomain matches excluding any previously matched direct subdomain matches.
 * If we have no subdomain : return all matches (top level and other possible subdomain
 * matches) with top-level domain matches first. Pushes subdomain matches on top */
export const selectAutofillLoginCandidates = (options: SelectAutofillCandidatesOptions) => {
    const { domain, subdomain, isPrivate, isSecure, shareIds, strict } = options;
    const protocol = !isSecure && options.protocol ? options.protocol : null;

    return domain === null
        ? NOOP_LIST_SELECTOR<ItemRevisionWithOptimistic<'login'>>
        : createSelector(
              [
                  selectItemsByDomain(domain, { protocol, isPrivate, shareIds, sortOn: 'priority', strict }),
                  selectItemsByDomain(subdomain, { protocol, isPrivate, shareIds, sortOn: 'lastUseTime', strict }),
              ],
              (domainMatches, subdomainMatches) => deduplicate(subdomainMatches.concat(domainMatches), itemEq)
          );
};

export const selectAutofillIdentityCandidates = (shareIds?: string[]) =>
    createSelector(selectIdentityItems, (items) =>
        items.filter(and(isActive, belongsToShares(shareIds))).sort(sortOn('lastUseTime'))
    );

export const selectAutosaveCandidate = (options: SelectAutosaveCandidatesOptions) =>
    createSelector(
        [
            selectItemsByDomain(options.subdomain, { protocol: null, isPrivate: false, shareIds: options.shareIds }),
            selectItemsByDomain(options.domain, { protocol: null, isPrivate: false, shareIds: options.shareIds }),
            () => options.userIdentifier,
        ],
        (subdomainItems, domainItems, userIdentifier) => {
            const candidates = deduplicate(subdomainItems.concat(domainItems), itemEq);
            if (!userIdentifier) return candidates;
            return candidates.filter(hasUserIdentifier(userIdentifier));
        }
    );

export const selectOTPCandidate = ({ submission, ...options }: SelectOTPAutofillCandidateOptions) =>
    createSelector(selectAutofillLoginCandidates({ ...options, strict: true }), (candidates) => {
        const otpItems = candidates.filter(hasOTP);
        const userIdentifier = submission?.data.userIdentifier;

        if (userIdentifier) return otpItems.find(hasUserIdentifier(userIdentifier));
        else return otpItems.sort(sortOn('lastUseTime'))[0];
    });

export const selectPasskeys = (payload: PasskeyQueryPayload) =>
    createSelector(selectAllItems, (items): SelectedPasskey[] => {
        const { credentialIds } = payload;
        const { domain } = parseUrl(payload.domain);

        return domain
            ? items
                  .filter((item): item is ItemRevision<'login'> => isActive(item) && isPasskeyItem(item.data))
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

export const selectAllSecureLinks = createSelector(selectSecureLinks, (byShareId): SecureLink[] =>
    Object.values(byShareId).flatMap((byItemId) => Object.values(byItemId).flat())
);

export const selectInactiveSecureLinks = createSelector(selectAllSecureLinks, (links) =>
    links.filter(not(prop('active')))
);

const selectItemsWithSecureLink = createSelector(
    [selectAllItems, selectSecureLinks],
    (items, secureLinks): ItemRevision[] =>
        items.reduce<ItemRevision[]>((acc, item) => {
            if (secureLinks[item.shareId]?.[item.itemId]?.length) acc.push(item);
            return acc;
        }, [])
);

export const selectOptimisticItemsWithSecureLink = selectOptimisticItemsFactory(selectItemsWithSecureLink);

export const selectItemSecureLinks = (shareId: string, itemId: string) =>
    createSelector(selectSecureLinks, (secureLinks): SecureLink[] =>
        (secureLinks[shareId]?.[itemId] ?? []).slice().sort(sortOn('active', 'DESC'))
    );

export const selectSecureLinksByShareId = (shareId: string) =>
    createSelector(selectSecureLinks, (secureLinks): SecureLink[] =>
        Object.values(secureLinks?.[shareId] ?? {}).flat()
    );

export const selectSecureLinksByItems = (items: BulkSelectionDTO) =>
    createSelector(selectSecureLinks, (secureLinks): SecureLink[] =>
        Object.entries(items).flatMap(([shareId, item]) => {
            const [itemId] = Object.keys(item);

            return secureLinks[shareId]?.[itemId] ?? [];
        })
    );
