import { compute } from '../compute';
import type { NavContext } from '../types/models';
import type { NavArgs, NavItemDefinition, NavItemResolved, NavResolved } from '../types/nav';
import { assertUniqueIds } from './assertUniqueIds';

const isNotPruned = (item: NavItemResolved | null): item is NavItemResolved => item !== null;

function resolveItem<TContext extends NavContext>(
    definition: NavItemDefinition<TContext>,
    context: TContext
): NavItemResolved | null {
    if (definition.isVisible && !definition.isVisible({ context })) {
        return null;
    }

    const children = definition.children ?? [];
    const resolvedChildren = children.map((item) => resolveItem(item, context)).filter(isNotPruned);

    const to = compute(definition.to, context);
    if (!to && resolvedChildren.length === 0) {
        return null;
    }

    return {
        id: definition.id,
        label: compute(definition.label, context),
        to,
        icon: compute(definition.icon, context),
        meta: compute(definition.meta, context) ?? {},
        children: resolvedChildren.length ? resolvedChildren : undefined,
    };
}

/**
 * Builds a resolved nav tree from a definition object and a runtime context.
 *
 * The `definition` argument should be declared with `as const satisfies NavDefinition<YourContext>`
 * to preserve literal types for use with `defineSearchOptions`.
 *
 * Each item field (`label`, `to`, `icon`, `meta`) may be provided statically or as
 * a function of the context. The optional `isVisible` predicate gates the item — if
 * it returns `false` the item and its subtree are pruned. Items with no resolved `to`
 * and no surviving children are also pruned, cascading up so containers whose
 * entire subtree disappeared are removed too.
 *
 * To prepend a route prefix to every resolved `to`, pipe the result through `applyPrefix`.
 *
 * @throws {DuplicateNavIdError} if any ids are duplicated anywhere in the tree
 * (the error lists every duplicate, not just the first one found).
 */
export function defineNavigation<TContext extends NavContext = NavContext>({
    definition,
    context,
}: NavArgs<TContext>): NavResolved {
    assertUniqueIds(definition.items);

    const items = definition.items.map((item) => resolveItem(item, context)).filter(isNotPruned);
    return { items };
}
