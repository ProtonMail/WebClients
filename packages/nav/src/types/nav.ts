import type { IconName } from '@proton/icons/types';

import type { NavContext } from './models';

type Meta = Record<string, unknown>;

/**
 * A value that may be provided statically or computed from the runtime context.
 *
 * @example to: '/dashboard'
 * @example to: ({ context }) => context.flags.includes('v2') ? '/dashboard-v2' : '/dashboard'
 */
export type Computed<T, TContext extends NavContext = NavContext> = T | ((args: { context: TContext }) => T);

export interface NavItemDefinition<TContext extends NavContext = NavContext> {
    id: string;
    label: Computed<string, TContext>;
    to?: Computed<string | undefined, TContext>;
    icon?: Computed<IconName | undefined, TContext>;
    meta?: Computed<Meta, TContext>;
    children?: NavItemDefinition<TContext>[];
    /**
     * Predicate gate. If it returns `false`, the item and its entire subtree are
     * pruned from the resolved tree. Defaults to "always include."
     */
    isVisible?: (args: { context: TContext }) => boolean;
}

export interface NavItemResolved {
    id: string;
    label: string;
    to: string | undefined;
    icon: IconName | undefined;
    meta: Meta;
    children: NavItemResolved[] | undefined;
}

export interface NavDefinition<TContext extends NavContext = NavContext> {
    items: NavItemDefinition<TContext>[];
}

export interface NavResolved {
    items: NavItemResolved[];
}

export interface NavArgs<TContext extends NavContext = NavContext> {
    definition: NavDefinition<TContext>;
    context: TContext;
}
