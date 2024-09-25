import type { Item, MaybeNull } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { resolveDomain } from '@proton/pass/utils/url/utils';

export enum ItemUrlMatch {
    TOP_MATCH = 1,
    SUB_MATCH = 0,
    NO_MATCH = -1,
}

/* This utility will give a score for a given login item :
 * - priority = -1 : no match
 * - priority = 0 : non-top level domain match
 * - priority = 1 : direct top-level domain match */
export const getItemPriorityForUrl =
    (item: Item<'login'>) =>
    (
        match: string,
        options: { protocol: MaybeNull<string>; port: MaybeNull<string>; isPrivate: boolean; strict?: boolean }
    ): ItemUrlMatch =>
        item.content.urls.reduce<number>((priority, url) => {
            const parsedUrl = parseUrl(url);

            /* if an item's domain is parsed as null then
             * we're dealing with a corrupted url */
            if (parsedUrl.domain === null) return priority;
            if (options.port && parsedUrl.port !== options.port) return priority;
            if (options.protocol && parsedUrl.protocol !== options.protocol) return priority;

            /** In strict mode :
             * - If `match` is a top-level domain: only matches URLs without a subdomain
             * - If `match` is a sub-domain: only matches on exact URL match */
            const itemDomain = resolveDomain(parsedUrl);
            if (options.strict && itemDomain !== match) return priority;

            /* Check for strict domain match - this leverages
             * the public suffix list from `tldts`. If dealing
             * with a private domain, this will exclude private
             * top-level domains when trying to match a private
             * subdomain. */
            const domainMatch = parsedUrl.domain === match;

            /* If the URL we are trying to match is a non-private
             * subdomain: allow resolving deeper subdomains for this
             * specific subdomain. */
            const subdomainMatch = !options?.isPrivate
                ? parsedUrl.subdomain && parsedUrl.subdomain.endsWith(match) && match.includes(parsedUrl.domain)
                : parsedUrl.subdomain === match;

            /* no match -> skip */
            if (!(domainMatch || subdomainMatch)) return priority;

            return Math.max(
                priority,
                parsedUrl.isTopLevelDomain && domainMatch ? ItemUrlMatch.TOP_MATCH : ItemUrlMatch.SUB_MATCH
            );
        }, ItemUrlMatch.NO_MATCH);
