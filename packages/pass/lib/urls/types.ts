import type { ItemUrlMatch } from '@proton/pass/lib/urls/search/match-url';
import type { ItemRevision, MaybeNull } from '@proton/pass/types';

export type ParsedUrl = {
    /* domain without suffix */
    displayName: MaybeNull<string>;
    /* widest top-level domain */
    domain: MaybeNull<string>;
    /* subdomain if any */
    subdomain: MaybeNull<string>;
    /* hostname of the URL */
    hostname: MaybeNull<string>;
    /* protocol */
    protocol: MaybeNull<string>;
    /* port */
    port: MaybeNull<string>;
    /* URL matches top-level domain */
    isTopLevelDomain: boolean;
    /* private domain from public suffix list */
    isPrivate: boolean;
    /* matches `https:` protocol */
    isSecure: boolean;
    /* full original url */
    url: MaybeNull<string>;
    /* clean url without search params and hash */
    cleanUrl: MaybeNull<string>;
};

export type URLComponents = Pick<ParsedUrl, 'domain' | 'port' | 'protocol'>;

export type SanitizedUrl = {
    valid: boolean;
    hostname: MaybeNull<string>;
    protocol: MaybeNull<string>;
    port: MaybeNull<string>;
    url: string;
    cleanUrl: MaybeNull<string>;
};

export type ItemWithPriority = {
    item: ItemRevision<'login'>;
    priority: ItemUrlMatch;
};

export type SortOnItems = 'priority' | 'lastUseTime';

export type SearchItemsByDomainOptions = {
    shareIds?: string[];
    sortOn?: SortOnItems;
    strict?: boolean;
    regexEnabled?: boolean;
    privateDomains?: Set<string>;
};
