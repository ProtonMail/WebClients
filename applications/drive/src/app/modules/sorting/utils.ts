import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortConfig, SortField } from './types';

/**
 * Sorts items using multi-level sorting configuration
 *
 * @param items - Array of items to sort
 * @param sortConfig - Array of sort levels (field + comparator)
 * @param direction - Sort direction for the primary level
 * @param getValueForField - Function to extract value from item for a given field
 * @param getKey - Function to extract the key/uid from an item
 * @returns Array of sorted keys/uids
 *
 * @example
 * sortItems(
 *   items,
 *   [
 *     { field: SortField.nodeType, comparator: nodeTypeComparator },
 *     { field: SortField.name, comparator: stringComparator }
 *   ],
 *   SORT_DIRECTION.ASC,
 *   (item, field) => item[field],
 *   (item) => item.uid
 * );
 */
export function sortItems<T>(
    items: T[],
    sortConfig: SortConfig,
    direction: SORT_DIRECTION,
    getValueForField: (item: T, field: SortField) => unknown,
    getKey: (item: T) => string
): string[] {
    if (!sortConfig || sortConfig.length === 0) {
        return items.map(getKey);
    }

    return [...items]
        .sort((a, b) => {
            for (let i = 0; i < sortConfig.length; i++) {
                const { field, comparator, direction: levelDirection } = sortConfig[i];
                const valueA = getValueForField(a, field);
                const valueB = getValueForField(b, field);
                const result = (comparator as (a: unknown, b: unknown) => number)(valueA, valueB);

                if (result !== 0 && !Number.isNaN(result)) {
                    // Use level-specific direction if provided, otherwise use global direction
                    const effectiveDirection = levelDirection ?? direction;
                    return effectiveDirection === SORT_DIRECTION.DESC ? -result : result;
                }
            }
            return 0;
        })
        .map(getKey);
}
