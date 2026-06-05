import type { IconName } from '@proton/icons/types';

/**
 * A node in the sidebar tree, as produced by `defineSidebar`.
 *
 * This is a deliberately strict, standalone contract — it is NOT derived from
 * `NavItemResolved`. The sidebar renders only the fields declared here, so the
 * resolved nav model can grow (search-only fields, metadata, future concerns)
 * without widening what the sidebar consumes. Fields the sidebar never reads —
 * `sections` (search-only) and `hideFromSidebar` (already applied during
 * pruning, so always meaningless on the output) — are intentionally absent.
 *
 * When the sidebar genuinely needs a new field, add it here and map it
 * explicitly in `defineSidebar`. That extra step is the point: the boundary
 * stays explicit.
 */
export interface SidebarNode {
    id: string;
    label: string;
    to: string | undefined;
    icon: IconName | undefined;
    meta: Record<string, unknown>;
    children: SidebarNode[] | undefined;
}

export interface SidebarTree {
    items: SidebarNode[];
}
