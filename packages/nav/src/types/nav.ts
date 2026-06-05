import type { IconName } from '@proton/icons/types';

import type { Computed } from './computed';
import type { NavContext } from './models';
import type { NavSectionDefinition, NavSectionResolved } from './section';

type Meta = Record<string, unknown>;

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
    sections?: NavSectionDefinition<TContext>[];
    /**
     * When `true`, the item is kept in the resolved tree (and remains reachable,
     * e.g. via search) but is omitted from the sidebar. Use for subroutes —
     * children routes that should not surface as sidebar entries.
     * @default false
     */
    hideFromSidebar?: Computed<boolean, TContext>;
}

export interface NavItemResolved {
    id: string;
    label: string;
    to: string | undefined;
    icon: IconName | undefined;
    meta: Meta;
    children: NavItemResolved[] | undefined;
    sections: NavSectionResolved[] | undefined;
    hideFromSidebar: boolean;
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
