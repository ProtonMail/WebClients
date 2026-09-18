import { decodeFilters, encodeFilters, getInitialFilters, removeLocalPath, setSearchFilters } from './routing';

describe('routing utils', () => {
    test('removeLocalPath', () => {
        expect(removeLocalPath('/u/123/path')).toBe('path');
        expect(removeLocalPath('/u/123/path/sub-path/')).toBe('path/sub-path/');
        expect(removeLocalPath('/u/123/')).toBe('');
        expect(removeLocalPath('/u/123')).toBe('');
        expect(removeLocalPath('/some/other/path')).toBe('/some/other/path');
        expect(removeLocalPath('/some/other/path/')).toBe('/some/other/path/');
        expect(removeLocalPath('/u/localID/')).toBe('/u/localID/');
        expect(removeLocalPath('/u/')).toBe('/u/');
    });
});

describe('setSearchFilters', () => {
    test('merges over the current filters and preserves other search params', () => {
        const filters = { ...getInitialFilters(), selectedShareId: 'share-1', selectedFolderId: 'folder-1' };
        const search = new URLSearchParams({ foo: 'bar', filters: encodeFilters(filters) });

        setSearchFilters(search, { selectedFolderId: null });

        expect(search.get('foo')).toBe('bar');
        expect(decodeFilters(search.get('filters'))).toEqual({ ...filters, selectedFolderId: null });
    });

    test('ignores `undefined` values', () => {
        const filters = { ...getInitialFilters(), search: 'query' };
        const search = new URLSearchParams({ filters: encodeFilters(filters) });

        setSearchFilters(search, { search: undefined, type: 'login' });

        expect(decodeFilters(search.get('filters'))).toEqual({ ...filters, type: 'login' });
    });

    test('uses the default filters when the search has none', () => {
        const search = new URLSearchParams();

        setSearchFilters(search, { selectedShareId: 'share-1' });

        expect(decodeFilters(search.get('filters'))).toEqual({ ...getInitialFilters(), selectedShareId: 'share-1' });
    });
});
