import type { NavItemResolved, NavResolved } from '../types/nav';

/**
 * Finds a resolved nav item by its `id`, searching the whole tree (depth-first,
 * declaration order). Returns `undefined` if no item matches — note that an id
 * present in the definition can still be absent here if the item was pruned
 * during resolution (e.g. `isVisible` returned `false`).
 *
 * Pair with `NavDefinitionIds<typeof definition>` to constrain `id` to the
 * definition's known ids.
 */
export function findNavItemById(nav: NavResolved, id: string): NavItemResolved | undefined {
    function walk(items: NavItemResolved[]): NavItemResolved | undefined {
        for (const item of items) {
            if (item.id === id) {
                return item;
            }
            if (item.children) {
                const found = walk(item.children);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }

    return walk(nav.items);
}
