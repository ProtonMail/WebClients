import truncate, { DEFAULT_TRUNCATE_OMISSION } from './truncate';

describe('truncate()', () => {
    it('returns empty sting if provided string is empty', () => {
        expect(truncate('', 0)).toEqual('');
        expect(truncate('', 1)).toEqual('');
        expect(truncate('', 2)).toEqual('');
    });

    it('truncates to required length', () => {
        const length = 3;

        const result = truncate('abcd', length);

        expect(result.length).toEqual(length);
    });

    describe('charsToDisplay', () => {
        it('defaults to 50', () => {
            const str = 'a'.repeat(51);

            const result = truncate(str);

            expect(result.length).toBe(50);
        });

        it('returns inputted string if charsToDisplay is the length of the string', () => {
            const testStrings = ['a', 'ab', 'abc'];

            const results = testStrings.map((str) => truncate(str, str.length));

            expect(results).toStrictEqual(testStrings);
        });

        it('returns inputted string if charsToDisplay is more than the length of the string', () => {
            const str = '12345';

            const result = truncate(str, str.length + 1);

            expect(result).toBe(str);
        });

        it('returns truncated string if charsToDisplay is less than the length of the string', () => {
            const str = '12345';

            const result = truncate(str, str.length - 1);

            expect(result).toBe('123' + DEFAULT_TRUNCATE_OMISSION);
        });
    });

    describe('omission', () => {
        it('uses default omission if not provided', () => {
            const result = truncate('ab', 1);

            expect(result).toEqual(DEFAULT_TRUNCATE_OMISSION);
        });

        it('uses provided omission', () => {
            const omission = 'omission';

            const result = truncate('ab', 1, omission);

            expect(result).toEqual(omission);
        });
    });
});
