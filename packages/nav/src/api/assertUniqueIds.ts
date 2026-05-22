import { DuplicateNavIdError } from '../errors';
import type { NavItemDefinition } from '../types/nav';

function collectDuplicateIds(
    items: NavItemDefinition<any>[],
    seen: Set<string> = new Set(),
    duplicates: Set<string> = new Set()
): Set<string> {
    for (const item of items) {
        if (seen.has(item.id)) {
            duplicates.add(item.id);
        } else {
            seen.add(item.id);
        }
        if (item.children?.length) {
            collectDuplicateIds(item.children, seen, duplicates);
        }
    }
    return duplicates;
}

export function assertUniqueIds(items: NavItemDefinition<any>[]): void {
    const duplicates = collectDuplicateIds(items);
    if (duplicates.size > 0) {
        throw new DuplicateNavIdError([...duplicates]);
    }
}
