import uncapitalize from './uncapitalize';

describe('uncapitalize()', () => {
    it('returns an empty string when an empty string is provided', () => {
        expect(uncapitalize('')).toBe('');
    });

    it('uncapitalizes a single letter', () => {
        expect(uncapitalize('A')).toBe('a');
    });

    it('uncapitalizes only the first letter', () => {
        expect(uncapitalize('Abc')).toBe('abc');
    });

    it('uncapitalizes the first letter even if it is already lowercase', () => {
        expect(uncapitalize('abc')).toBe('abc');
    });

    it(`doesn't affect other letters`, () => {
        expect(uncapitalize('ABc')).toBe('aBc');
    });
});
