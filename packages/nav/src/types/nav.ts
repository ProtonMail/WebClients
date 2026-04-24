import type { IconName } from '@proton/icons/types';

import type { NavContext } from './models';

type Meta = Record<string, unknown>;

export interface NavItemResolved {
    id: string;
    label: string;
    to: string | undefined;
    children: NavItemResolved[] | undefined;
    icon: IconName | undefined;
    meta: Meta;
}

export interface NavResolved {
    items: NavItemResolved[];
}

type NavItemResolverAction =
    | { _action: 'keep' }
    | { _action: 'remove' }
    | { _action: 'update'; patch: Partial<NavItemResolved> };

/**
 * The three actions available inside a resolver.
 * Passed as the third argument to every resolver function.
 *
 * - `keep()`   — include the item unchanged
 * - `remove()` — exclude the item from the tree
 * - `update()` — merge a partial patch onto the item
 */
export interface NavItemResolverActions {
    /** Include the item with no changes. */
    keep: () => NavItemResolverAction;
    /** Exclude the item from the resolved tree. */
    remove: () => NavItemResolverAction;
    /**
     * Merge a partial patch onto the item.
     *
     * @example
     * update({ to: isFlag ? '/route-B' : 'route-A' })
     */
    update: (patch: Partial<NavItemResolved>) => NavItemResolverAction;
}

export type NavItemResolver<TContext extends NavContext = NavContext> = (
    _: { item: NavItemResolved; context: TContext } & NavItemResolverActions
) => NavItemResolverAction;

export interface NavItemDefinition<TContext extends NavContext = NavContext> {
    id: string;
    label: string | (() => string);
    to?: string;
    children?: NavItemDefinition<TContext>[];
    icon?: IconName;
    meta?: Meta;
    resolver?: NavItemResolver<TContext>;
}

export interface NavDefinition<TContext extends NavContext = NavContext> {
    items: NavItemDefinition<TContext>[];
}

export interface NavArgs<TContext extends NavContext = NavContext> {
    definition: NavDefinition<TContext>;
    context: TContext;
}
