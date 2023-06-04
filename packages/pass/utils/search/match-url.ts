import type { ItemType } from '@proton/pass/types';
import type { ItemMatchFunc } from '@proton/pass/utils/search';

import { isLoginItem } from '../pass/items';
import { parseUrl } from '../url';

export const matchLoginItemByUrl: ItemMatchFunc<ItemType, { protocolFilter?: string[]; isPrivate: boolean }> =
    (item) => (match: string, options) =>
        isLoginItem(item) &&
        item.content.urls
            .map((url) => parseUrl(url))
            .filter((url) => {
                /* if an item's domain is parsed as null then
                 * we're dealing with a corrupted url */
                if (url.domain === null) return false;

                /* Check for strict domain match - this leverages
                 * the public suffix list from `tldts`. If dealing
                 * with a private domain, this will exclude private
                 * top-level domains when trying to match a private
                 * subdomain. */
                const domainMatch = url.domain === match;

                /* If the URL we are trying to match is a non-private
                 * subdomain: allow resolving deeper subdomains for this
                 * specific subdomain. */
                const subdomainMatch = !options?.isPrivate
                    ? url.subdomain && url.subdomain.endsWith(match)
                    : url.subdomain === match;

                /* no match -> skip */
                if (!(domainMatch || subdomainMatch)) return false;

                /* check protocol if filter provided */
                return (
                    !options?.protocolFilter ||
                    options.protocolFilter.length === 0 ||
                    options.protocolFilter.some((protocol) => url.protocol === protocol)
                );
            }).length > 0;
