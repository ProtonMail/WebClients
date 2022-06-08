import capitalize from './capitalize';

describe('capitalize()', () => {
    it('returns undefined when called with undefined', () => {
        expect(capitalize(undefined)).toBe(undefined);
    });

    it('returns an empty string when an empty string is provided', () => {
        expect(capitalize('')).toBe('');
    });

    it('capitalizes a single letter', () => {
        expect(capitalize('a')).toBe('A');
    });

    it('capitalizes only the first letter', () => {
        expect(capitalize('abc')).toBe('Abc');
    });

    it('capitalizes the first letter even if it is already a capital', () => {
        expect(capitalize('Abc')).toBe('Abc');
    });

    it(`doesn't affect other capital letters`, () => {
        expect(capitalize('ABc')).toBe('ABc');
    });
});
