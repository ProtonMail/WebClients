import {
    decodeFilters,
    encodeFilters,
    getAddAccountHref,
    getInitialFilters,
    getOriginAccountHref,
    removeLocalPath,
    setSearchFilters,
} from './routing';

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

describe('add account routes', () => {
    test('getAddAccountHref carries the local ID of the account the user comes from', () => {
        expect(getAddAccountHref(3)).toBe('/auth/add?localID=3');
        expect(getAddAccountHref(0)).toBe('/auth/add?localID=0');
        expect(getAddAccountHref(undefined)).toBe('/auth/add');
    });

    test('getOriginAccountHref goes back to the account the user comes from', () => {
        expect(getOriginAccountHref('?localID=3')).toBe('/u/3');
        expect(getOriginAccountHref('?localID=0')).toBe('/u/0');
    });

    test('getOriginAccountHref goes back to the lobby without a valid local ID', () => {
        expect(getOriginAccountHref('')).toBe('/');
        expect(getOriginAccountHref('?localID=')).toBe('/');
        expect(getOriginAccountHref('?localID=abc')).toBe('/');
        expect(getOriginAccountHref('?localID=3/../../x')).toBe('/');
    });
});
