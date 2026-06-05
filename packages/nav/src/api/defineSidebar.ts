import type { NavContext } from '../types/models';
import type { NavArgs, NavItemResolved, NavResolved } from '../types/nav';
import type { SidebarNode, SidebarTree } from '../types/sidebar';
import { defineNavigation } from './defineNavigation';

/**
 * Produces the nav tree to render in the sidebar from a definition (or an
 * already-resolved tree).
 *
 * Items flagged with `hideFromSidebar` are dropped along with their entire
 * subtree — a hidden node behaves as if it never existed, so its children have
 * no parent to hang from and disappear with it.
 *
 * Pruning cascades the same way `defineNavigation` prunes: a container left with
 * no `to` and no surviving children is itself removed, since there is nothing
 * left to navigate to or reveal.
 */
export function defineSidebar<TContext extends NavContext>(arg: NavArgs<TContext> | NavResolved): SidebarTree {
    const resolved: NavResolved = 'definition' in arg ? defineNavigation(arg) : arg;

    function prune(items: NavItemResolved[]): SidebarNode[] {
        return items.reduce<SidebarNode[]>((kept, item) => {
            if (item.hideFromSidebar) {
                return kept;
            }

            const children = item.children ? prune(item.children) : [];
            if (!item.to && children.length === 0) {
                return kept;
            }

            kept.push({
                id: item.id,
                label: item.label,
                to: item.to,
                icon: item.icon,
                meta: item.meta,
                children: children.length ? children : undefined,
            });
            return kept;
        }, []);
    }

    return { items: prune(resolved.items) };
}
