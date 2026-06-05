import type { SidebarNode } from '@proton/nav/types/sidebar';

interface Match {
    parents: SidebarNode[];
    to: string;
}

/**
 * True when `pathname` either equals `to` exactly or extends it by one or more
 * additional path segments. The trailing-slash check prevents false positives
 * like `/vpn/recoveryx` matching `/vpn/recovery`.
 */
function isPrefixMatch(pathname: string, to: string): boolean {
    return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * Walks the tree and collects every item whose `to` is a prefix of `pathname`,
 * along with the chain of ancestors leading to it.
 */
function getMatchingItems(items: SidebarNode[], pathname: string): Match[] {
    const matches: Match[] = [];

    function walk(item: SidebarNode, parents: SidebarNode[]): void {
        if (item.to && isPrefixMatch(pathname, item.to)) {
            matches.push({ parents, to: item.to });
        }
        item.children?.forEach((child) => walk(child, [...parents, item]));
    }

    items.forEach((item) => walk(item, []));
    return matches;
}

/**
 * Picks the match whose `to` is longest.
 * The deepest, most specific route.
 *
 * @example
 * For `/vpn/settings/email`, this prefers `/vpn/settings` over `/vpn`.
 */
function pickBestBranchesFrom(matches: Match[]) {
    const bestMatches = matches.reduce<Match | undefined>((best, current) => {
        if (!best || current.to.length > best.to.length) {
            return current;
        }
        return best;
    }, undefined);

    return new Set(bestMatches?.parents.map((parent) => parent.id) ?? []);
}

/**
 * Returns the set of branch IDs that need to be open in order to reveal the
 * sidebar item matching the current pathname.
 *
 * Matching is prefix-based on path segments, so a URL like `/vpn/recovery/email`
 * still resolves to the `/vpn/recovery` item even when `/email` is not itself
 * a registered route. When multiple items match, the most specific one wins.
 *
 * @example
 * Given a tree where `/vpn/gateways` lives under `organization` → `organization.vpn`:
 * ```ts
 * findActiveBranches(items, '/vpn/gateways')
 * // → Set { 'organization', 'organization.vpn' }
 * ```
 */
export function getActiveBranches(items: SidebarNode[], pathname: string): Set<string> {
    const matches = getMatchingItems(items, pathname);
    return pickBestBranchesFrom(matches);
}
