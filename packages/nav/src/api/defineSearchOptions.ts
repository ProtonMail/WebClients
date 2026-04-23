import type { IconName } from '@proton/icons/types';

import type { NavItemDefinition, NavItemResolved, NavResolved } from '../types/nav';
import type { SearchOptionsResolved, Section } from '../types/searchOptions';
import { unwrap } from '../unwrap';

type ExtractIds<T extends readonly NavItemDefinition<any>[]> = T[number] extends infer Item
    ? Item extends { id: infer Id; to: string; children?: never }
        ? Id
        : Item extends { children: readonly NavItemDefinition<any>[] }
          ? ExtractIds<Item['children']>
          : never
    : never;

/**
 * Builds a flat list of search options from a resolved nav tree.
 *
 * Each leaf node (item with a `to` and no children) becomes a `SearchOption`.
 * Optionally, extra entries can be appended after a leaf by passing `sections`.
 *
 * The nav definition should be declared with `as const satisfies NavDefinition<YourContext>`
 * to preserve literal id types. Pass `typeof yourDefinition.items` as the generic
 * to get autocomplete and type safety on the `sections` keys.
 *
 * @example
 * const searchOptions = defineSearchOptions<typeof routesDefinition.items>(resolvedNav, {
 *     'organization.vpn.gateways': [{ value: 'Privacy', icon: 'lock', to: '#privacy' }],
 * });
 *
 * @returns A flat array of `SearchOption` entries.
 */
export function defineSearchOptions<TNavIds extends readonly NavItemDefinition<any>[]>(
    nav: NavResolved,
    sections?: Partial<Record<ExtractIds<TNavIds>, Section[]>>
) {
    const results: SearchOptionsResolved = [];

    function traverse(items: NavItemResolved[], breadcrumbs: string[], nearestIcon: IconName | undefined) {
        for (const item of items) {
            const icon = item.icon ?? nearestIcon;
            const value = unwrap(item.label);

            if (item.children) {
                traverse(item.children, [...breadcrumbs, value], icon);
            } else if (item.to) {
                results.push({
                    value,
                    icon,
                    to: item.to,
                    in: breadcrumbs,
                });

                const sectionList = sections?.[item.id as ExtractIds<TNavIds>];
                if (sectionList) {
                    for (const section of sectionList) {
                        results.push({
                            value: unwrap(section.value),
                            icon: section.icon ?? icon,
                            to: `${item.to}${section.to}`,
                            in: [...breadcrumbs, value],
                        });
                    }
                }
            }
        }
    }

    traverse(nav.items, [], undefined);

    return results;
}
