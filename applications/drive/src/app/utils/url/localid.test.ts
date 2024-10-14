import { getLocalID } from './localid';

describe('getLocalID', () => {
    test('extracts local ID from valid URL', () => {
        const url = 'https://drive.proton.me/u/123/some-path';
        expect(getLocalID(url)).toBe('123');
    });

    test('returns null for URL without local ID', () => {
        const url = 'https://drive.proton.me/some-path';
        expect(getLocalID(url)).toBeNull();
    });

    test('returns null for invalid URL', () => {
        const url = 'not-a-valid-url';
        expect(getLocalID(url)).toBeNull();
    });

    test('returns null when local ID is not present in correct format', () => {
        const url = 'https://drive.proton.me/123/u/some-path';
        expect(getLocalID(url)).toBeNull();
    });

    test('correctly handles multiple numbers in URL', () => {
        const url = 'https://drive.proton.me/u/789/some/123/path';
        expect(getLocalID(url)).toBe('789');
    });

    test('returns null for URL with /u/ but no number', () => {
        const url = 'https://drive.proton.me/u//some-path';
        expect(getLocalID(url)).toBeNull();
    });

    test('handles URL with query parameters', () => {
        const url = 'https://drive.proton.me/u/101/some-path?param=value';
        expect(getLocalID(url)).toBe('101');
    });
});
