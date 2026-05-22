import type { NavItemResolved, NavResolved } from '../types/nav';

function prefixItem(item: NavItemResolved, prefix: string): NavItemResolved {
    return {
        ...item,
        to: item.to ? `${prefix}${item.to}` : item.to,
        children: item.children?.map((child) => prefixItem(child, prefix)),
    };
}

/**
 * Returns a new resolved nav tree with every `to` prepended by `prefix`.
 *
 * Items without a `to` are left untouched (the prefix is not applied to undefined).
 * An empty-string prefix is a no-op. The input tree is not mutated.
 *
 * @example
 * const nav = applyPrefix(defineNavigation({ definition, context }), '/vpn');
 */
export function applyPrefix(nav: NavResolved, prefix: string): NavResolved {
    if (!prefix) {
        return nav;
    }

    const { items, ...rest } = nav;
    return { ...rest, items: nav.items.map((item) => prefixItem(item, prefix)) };
}
