import { isActive, isItemType } from '@proton/pass/lib/items/item.predicates';
import { ItemUrlMatch, getItemPriorityForUrl } from '@proton/pass/lib/urls/search/match-url';
import type { ItemWithPriority, SearchItemsByDomainOptions, SortOnItems } from '@proton/pass/lib/urls/types';
import { parseUrl } from '@proton/pass/lib/urls/utils/parser';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { AutofillMode } from '@proton/pass/types/protobuf';
import { prop } from '@proton/pass/utils/fp/lens';

const sortMatchItems = (sortOn: SortOnItems) => (a: ItemWithPriority, b: ItemWithPriority) => {
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
        default:
            return 0;
    }
};

export const searchItemsByDomain = (
    url: Maybe<string>,
    items: ItemRevision[],
    {
        shareIds = undefined,
        sortOn = 'priority',
        strict = false,
        regexEnabled = false,
        privateDomains,
    }: SearchItemsByDomainOptions
): ItemRevision<'login'>[] => {
    const parsedUrl = parseUrl(url, privateDomains);

    if (parsedUrl.domain === null) return [];
    const domain = parsedUrl.domain;

    return (
        items
            // Early exit
            .filter(
                (item): item is ItemRevision<'login'> =>
                    isActive(item) &&
                    isItemType('login')(item) &&
                    (!shareIds || shareIds.includes(item.shareId)) &&
                    /* If the item does not pass this initial "fuzzy" test, then we
                     * should not even consider it as an autofill candidate.
                     * This avoids unnecessarily parsing items' URLs with 'tldts'.
                     * If there is one RegExp rule, fuzzy matching is impossible
                     * so we must proceed */
                    item.data.content.autofillUrls.some(
                        ({ url, mode }) =>
                            (regexEnabled && mode === AutofillMode.RegularExpression) ||
                            mode === AutofillMode.Pattern ||
                            url.includes(domain)
                    )
            )
            // Compute priority
            .map((item) => ({
                item,
                priority: getItemPriorityForUrl(parsedUrl, item, { strict, regexEnabled }),
            }))
            // Drop match failed
            .filter(({ priority }) => priority !== ItemUrlMatch.NO_MATCH)
            // Sort with our custom logic
            .sort(sortMatchItems(sortOn))
            .map(prop('item'))
    );
};
