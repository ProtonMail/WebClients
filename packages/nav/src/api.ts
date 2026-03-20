import { DuplicateNavIdError } from './errors';
import type { NavContext } from './types/models';
import type { NavArgs, NavItemDefinition, NavItemResolved, NavItemResolverActions, NavResolved } from './types/nav';
import { unwrap } from './unwrap';

function collectIds(items: NavItemDefinition<any>[], seen: Set<string>): void {
    for (const item of items) {
        if (seen.has(item.id)) {
            throw new DuplicateNavIdError(item.id);
        }
        seen.add(item.id);
        if (item.children && item.children.length > 0) {
            collectIds(item.children, seen);
        }
    }
}

const actions: NavItemResolverActions = {
    keep: () => ({ _action: 'keep' }),
    remove: () => ({ _action: 'remove' }),
    update: (patch) => ({ _action: 'update', patch }),
};

function resolveItem<TContext extends NavContext>(
    definition: NavItemDefinition<TContext>,
    context: TContext
): NavItemResolved | null {
    const resolvedChildren: NavItemResolved[] = [];

    if (definition.children && definition.children.length > 0) {
        for (const child of definition.children) {
            const resolvedChild = resolveItem(child, context);
            if (resolvedChild !== null) {
                resolvedChildren.push(resolvedChild);
            }
        }
    }

    let resolved: NavItemResolved = {
        id: definition.id,
        label: unwrap(definition.label),
        icon: definition.icon,
        to: context?.prefix && definition.to ? `${context.prefix}${definition.to}` : definition.to,
        children: resolvedChildren.length ? resolvedChildren : undefined,
        meta: definition.meta ?? {},
    };

    if (definition.resolver) {
        const action = definition.resolver(resolved, context, actions);
        switch (action._action) {
            case 'remove':
                return null;
            case 'update': {
                const { meta: patchMeta, ...patchRest } = action.patch;
                resolved = {
                    ...resolved,
                    ...patchRest,
                    ...(patchMeta !== undefined && {
                        meta: { ...resolved.meta, ...patchMeta },
                    }),
                };
                break;
            }
            case 'keep':
                break;
        }
    }

    return resolved;
}

/**
 * Builds a resolved nav tree from a definition object and a runtime context.

 * @example
 * const nav = defineNavigation<AppContext>({ definition, context });
 * @returns {NavResolved} NavResolved
 * @throws {DuplicateNavIdError} DuplicateNavIdError if any two items share the same `id` 
 * anywhere in the definition tree
 */
export function defineNavigation<TContext extends NavContext = NavContext>(args: NavArgs<TContext>): NavResolved {
    const { definition, context } = args;

    collectIds(definition.items, new Set());

    const items: NavItemResolved[] = [];
    for (const item of definition.items) {
        const resolved = resolveItem(item, context);
        if (resolved !== null) {
            items.push(resolved);
        }
    }

    return { items };
}
