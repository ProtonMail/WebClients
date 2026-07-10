import type { NavDefinition } from './nav';

/**
 * Extracts the union of every nav item `id` from a definition's literal type.
 *
 * Recurses through `children`, so deeply-nested ids are included. Only works
 * when the definition is declared `as const` (so the literal id strings are
 * preserved); a widened `NavDefinition` yields `string`, making this useless.
 *
 * @example
 * const def = { items: [{ id: 'a', children: [{ id: 'a.b' }] }] } as const satisfies NavDefinition;
 * type Id = NavDefinitionIds<typeof def>; // 'a' | 'a.b'
 */
type NavItemIds<T> =
    | (T extends { id: infer Id extends string } ? Id : never)
    | (T extends { children: readonly (infer Child)[] } ? NavItemIds<Child> : never);

export type NavDefinitionIds<T extends NavDefinition | { items: readonly unknown[] }> = T extends {
    items: readonly (infer Item)[];
}
    ? NavItemIds<Item>
    : never;

/**
 * Finds the union of `sections[].id` given an item.id
 * Recurses through `children`. Resolves to `never` if the parent has no sections.
 *
 * @example
 * type S = SectionIdsOf<{ id: 'a'; sections: [{ id: 'a.x' }, { id: 'a.y' }] }, 'a'>; // 'a.x' | 'a.y'
 * type S = SectionIdsOf<{ id: 'a'; sections: [{ id: 'a.x' }, { id: 'a.y' }] }, 'b'>; // never
 */
type SectionIdsOf<T, ParentId extends string> =
    | (T extends { id: ParentId; sections: readonly (infer Section)[] }
          ? Section extends { id: infer SectionId extends string }
              ? SectionId
              : never
          : never)
    | (T extends { children: readonly (infer Child)[] } ? SectionIdsOf<Child, ParentId> : never);

/**
 * Extracts the union of section `id`s declared under the nav item identified by
 * `ParentId`, read straight from the definition's `sections` arrays (not from an
 * id naming convention). Like {@link NavDefinitionIds}, the definition must be
 * declared `as const` so the literal strings survive.
 *
 * Pair with `Record<NavSectionIds<typeof def, 'parent.id'>, ReactNode>` to build
 * a type-safe, exhaustive section → component map for any route.
 *
 * @example
 * type Id = NavSectionIds<typeof def, 'my-vpn.download-apps'>;
 * // 'my-vpn.download-apps.protonvpn-clients' | 'my-vpn.download-apps.wireguard-configuration' | ...
 */
export type NavSectionIds<
    T extends NavDefinition | { items: readonly unknown[] },
    ParentId extends string,
> = T extends { items: readonly (infer Item)[] } ? SectionIdsOf<Item, ParentId> : never;
