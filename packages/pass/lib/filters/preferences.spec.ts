import type { ItemFilters } from '../../types/data/items';
import { applyFilterPreferences } from './preferences';

describe('applyFilterPreferences', () => {
    const filters: ItemFilters = {
        search: 'query',
        selectedShareId: 'share-1',
        selectedFolderId: 'folder-1',
        sort: 'recent',
        type: '*',
    };

    test('applies the preferred sort and type', () => {
        const preferences: ItemFilters = {
            search: 'stale-query',
            selectedShareId: 'stale-share',
            selectedFolderId: 'stale-folder',
            sort: 'titleASC',
            type: 'login',
        };

        expect(applyFilterPreferences(filters, preferences)).toEqual({ ...filters, sort: 'titleASC', type: 'login' });
    });

    test('keeps the current values for preferences missing from older caches', () => {
        expect(applyFilterPreferences(filters, { sort: 'createTimeASC' })).toEqual({
            ...filters,
            sort: 'createTimeASC',
        });
        expect(applyFilterPreferences(filters, { type: 'note' })).toEqual({ ...filters, type: 'note' });
    });

    test('returns the filters unchanged without preferences', () => {
        expect(applyFilterPreferences(filters, null)).toEqual(filters);
    });
});
