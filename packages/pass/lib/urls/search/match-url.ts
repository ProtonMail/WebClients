import type { ItemRevision } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import type { AutofillUrl } from '../../../types/protobuf/item-v1';
import type { ParsedUrl } from '../types';
import { parseUrl } from '../utils/parser';
import { domainEndsWith, resolveSubdomain, safeRegExpFromPattern, urlGlobToRegExp } from '../utils/utils';

export enum ItemUrlMatch {
    /** Exact match
     * - domain exact match in default and exact modes
     * - clean url exact match starts with and exact path modes */
    EXACT_MATCH = 2,
    /** Top domain match
     * The item domain is a direct parent of the matching url domain */
    TOP_MATCH = 1,
    /** Sub domain match
     * The item parent domain match a parent domain of the matching url domain */
    SUB_MATCH = 0,
    /** No match */
    NO_MATCH = -1,
}
export const BEST_MATCH = ItemUrlMatch.EXACT_MATCH;

const sharePort = (item: ParsedUrl, match: ParsedUrl) => !match.port || item.port === match.port;

const shareProtocol = (item: ParsedUrl, match: ParsedUrl) =>
    match.isSecure || !match.protocol || item.protocol === match.protocol;

/** Main logic of the default mode when it's not an exact match
 * - exact match return early with biggest match value
 * - for private domains, only consider direct top domain match
 * - direct descendant returns top match
 * - common ancestor return sub match
 */
const matchDefault = (item: ParsedUrl, match: ParsedUrl, strict: boolean): ItemUrlMatch => {
    if (!sharePort(item, match) || !shareProtocol(item, match)) return ItemUrlMatch.NO_MATCH;

    const itemSubdomain = resolveSubdomain(item);
    const matchSubdomain = resolveSubdomain(match);
    if (!itemSubdomain || !matchSubdomain) return ItemUrlMatch.NO_MATCH;
    if (itemSubdomain === matchSubdomain) return ItemUrlMatch.EXACT_MATCH;

    if (match.isPrivate) {
        // For private domains, only consider direct top domain match
        return item.domain === match.domain ? ItemUrlMatch.TOP_MATCH : ItemUrlMatch.NO_MATCH;
    }
    // Direct descendant
    if (domainEndsWith(matchSubdomain, itemSubdomain)) return ItemUrlMatch.TOP_MATCH;
    // Common ancestor
    if (!strict && match.domain && domainEndsWith(itemSubdomain, match.domain)) return ItemUrlMatch.SUB_MATCH;
    return ItemUrlMatch.NO_MATCH;
};

/** If item and match have exact same domain, it's a strict match */
const matchExact = (item: ParsedUrl, match: ParsedUrl): ItemUrlMatch => {
    if (!sharePort(item, match) || !shareProtocol(item, match)) return ItemUrlMatch.NO_MATCH;
    const itemSubdomain = resolveSubdomain(item);
    const matchSubdomain = resolveSubdomain(match);
    return itemSubdomain && itemSubdomain === matchSubdomain ? ItemUrlMatch.EXACT_MATCH : ItemUrlMatch.NO_MATCH;
};

/** If mode is exact path, check against the clean url */
const matchExactPath = (item: ParsedUrl, match: ParsedUrl): ItemUrlMatch =>
    item.cleanUrl !== null && item.cleanUrl === match.cleanUrl ? ItemUrlMatch.EXACT_MATCH : ItemUrlMatch.NO_MATCH;

/** Starts with mode, execute a simple startsWith against the original url */
const matchStartsWith = (item: ParsedUrl, match: ParsedUrl): ItemUrlMatch => {
    // Using clean url to avoid matching on the beginning of domain if the url doesnt have a trailing slash
    if (!item.cleanUrl || !match.cleanUrl?.startsWith(item.cleanUrl)) return ItemUrlMatch.NO_MATCH;
    return item.cleanUrl === match.cleanUrl ? ItemUrlMatch.EXACT_MATCH : ItemUrlMatch.TOP_MATCH;
};

/** Leading scheme of a pattern/url, e.g. `https://` (includes the `://`). */
const PATTERN_PROTOCOL_RE = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * - A leading scheme in the pattern pins the protocol (the page must use it).
 * - Host pattern: avoids spoofing and early returns when hostname match is sufficient.
 * - With a path, the full scheme-stripped pattern is then globbed against the
 *   scheme-stripped URL (the hostname gate above already blocks cross-origin).
 */
const matchPattern = (autofillUrl: AutofillUrl, match: ParsedUrl): ItemUrlMatch => {
    if (!(match.hostname && match.url && match.protocol)) return ItemUrlMatch.NO_MATCH;

    /** Optional protocol pinned by the pattern: if set, the page must use it */
    const protocol = autofillUrl.url.match(PATTERN_PROTOCOL_RE)?.[0] ?? null;
    if (protocol && !match.url.startsWith(protocol.toLowerCase())) return ItemUrlMatch.NO_MATCH;

    /** Drop the scheme from both sides so wildcards only ever span host/path */
    const pattern = autofillUrl.url.slice(protocol?.length ?? 0);
    const target = match.url.slice(match.protocol.length + 2 /* `://` */);

    /** Split the pattern on its first `/` into host vs path. Hosts are matched
     * case-insensitively (domains aren't case-sensitive; the URL constructor
     * already lowercases `match.hostname`/the host segment of `match.url`, so
     * only the pattern's own host segment needs lowercasing here). Paths stay
     * case-sensitive: URL paths can genuinely differ by case. */
    const slashIdx = pattern.indexOf('/');
    const hostPart = (slashIdx === -1 ? pattern : pattern.slice(0, slashIdx)).toLowerCase();
    const hasPath = slashIdx !== -1;

    /** Host part is matched against the hostname alone (spoofing safeguard) */
    if (!urlGlobToRegExp(hostPart).test(match.hostname)) return ItemUrlMatch.NO_MATCH;

    /** No path constraint: matching the host is enough */
    if (!hasPath) return ItemUrlMatch.SUB_MATCH;

    /** With a path constraint, validate host + path together against the URL,
     * host segment lowercased, path segment as-authored */
    const pathPattern = hostPart + pattern.slice(hostPart.length);
    return urlGlobToRegExp(pathPattern).test(target) ? ItemUrlMatch.SUB_MATCH : ItemUrlMatch.NO_MATCH;
};

/** Regex mode, compile (memoized) the regex and use it against the url */
const matchRegex = (autofillUrl: AutofillUrl, match: ParsedUrl): ItemUrlMatch => {
    if (!match.url) return ItemUrlMatch.NO_MATCH;
    const regex = safeRegExpFromPattern(autofillUrl.url);
    return regex !== null && regex.test(match.url) ? ItemUrlMatch.SUB_MATCH : ItemUrlMatch.NO_MATCH;
};

const priorityFor = (
    autofillUrl: AutofillUrl,
    match: ParsedUrl,
    { strict, regexEnabled }: { strict: boolean; regexEnabled: boolean }
): ItemUrlMatch => {
    switch (autofillUrl.mode) {
        case AutofillMode.Never:
            return ItemUrlMatch.NO_MATCH;
        case AutofillMode.Pattern:
            return matchPattern(autofillUrl, match);
        case AutofillMode.RegularExpression:
            return regexEnabled ? matchRegex(autofillUrl, match) : ItemUrlMatch.NO_MATCH;
    }

    const item = parseUrl(autofillUrl.url);

    // if an item's domain is parsed as null then we're dealing with a corrupted url
    if (item.domain === null) return ItemUrlMatch.NO_MATCH;

    switch (autofillUrl.mode) {
        case AutofillMode.StartWith:
            return matchStartsWith(item, match);
        case AutofillMode.ExactPath:
            return matchExactPath(item, match);
        case AutofillMode.Exact:
            return matchExact(item, match);
        case AutofillMode.Default:
            return matchDefault(item, match, strict);
    }

    return ItemUrlMatch.NO_MATCH;
};

/** Returns true if the autofillUrl is a blocker to match on this matchUrl.
 * Blocking is scoped to the exact URL (path included), not the whole domain:
 * a `Never` rule only vetoes the item on the precise page it was set on. */
const isBlocker = (autofillUrl: AutofillUrl, matchUrl: ParsedUrl): boolean => {
    if (autofillUrl.mode !== AutofillMode.Never) return false;
    const item = parseUrl(autofillUrl.url);
    return matchExactPath(item, matchUrl) === ItemUrlMatch.EXACT_MATCH;
};

/** Return a ItemUrlMatch priority given the match url against the autofill urls inside the given item.
 * If any autofill url has the Never mode and matches, the item is fully blocked.
 * Strict option will ignore all but exact matches. */
export const getItemPriorityForUrl = (
    matchUrl: ParsedUrl,
    item: ItemRevision<'login'>,
    options: { strict: boolean; regexEnabled: boolean }
): ItemUrlMatch => {
    if (!matchUrl.domain) return ItemUrlMatch.NO_MATCH;
    const urls = item.data.content.autofillUrls;

    // Prepass to search for `Never` rules and avoid more computations
    if (urls.some((u) => isBlocker(u, matchUrl))) return ItemUrlMatch.NO_MATCH;

    let bestMatch = ItemUrlMatch.NO_MATCH;

    // Compute match value for each autofill urls
    urls.some((u) => {
        bestMatch = Math.max(bestMatch, priorityFor(u, matchUrl, options));
        // Early exit if we hit the best match
        return bestMatch === BEST_MATCH;
    });

    return bestMatch;
};
