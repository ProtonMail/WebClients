import type { NavItemResolved } from '@proton/nav/types/nav';

/**
 * Traverses a navigation tree and returns the set of branch IDs that are
 * ancestors of the leaf node matching the given pathname.
 *
 * This is used to determine which branches need to be open in order to
 * reveal the currently active leaf — regardless of URL structure or nesting depth.
 *
 * @remarks
 * Only branch IDs are included in the result — the matching leaf's own ID is excluded.
 * If no leaf matches the pathname, an empty Set is returned.
 *
 * @example
 * Given a tree where `/vpn/gateways` lives under `organization` → `organization.vpn`:
 * ```ts
 * findActiveBranches(items, '/vpn/gateways')
 * // → Set { 'organization', 'organization.vpn' }
 * ```
 *
 * @param items - The top-level navigation items to traverse
 * @param pathname - The current URL pathname to match against leaf `to` values
 * @returns A Set of branch IDs that are ancestors of the matching leaf
 */
export function findActiveBranches(items: NavItemResolved[], pathname: string): Set<string> {
    const active = new Set<string>();

    function walk(item: NavItemResolved, ancestors: NavItemResolved[]): void {
        if (item.to === pathname) {
            ancestors.forEach((a) => active.add(a.id));
            return;
        }
        item.children?.forEach((child) => walk(child, [...ancestors, item]));
    }

    items.forEach((item) => walk(item, []));
    return active;
}
