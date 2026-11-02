import type { ItemFilters } from '../../types/data/items';
import type { MaybeNull } from '../../types/utils';

export const applyFilterPreferences = (
    filters: ItemFilters,
    preferences: MaybeNull<Partial<ItemFilters>>
): ItemFilters => ({
    ...filters,
    sort: preferences?.sort ?? filters.sort,
    type: preferences?.type ?? filters.type,
});
