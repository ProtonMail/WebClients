import clsx from './clsx';

describe('clsx()', () => {
    it('handles array arguments', () => {
        const result = clsx(['a', 'b']);

        expect(result).toBe('a b');
    });

    it('returns empty string when empty array is passed', () => {
        const result = clsx([]);

        expect(result).toBe('');
    });

    it('returns empty string when empty string is passed', () => {
        const result = clsx('');

        expect(result).toBe('');
    });

    it('joins strings correctly', () => {
        const result = clsx('a', 'b');

        expect(result).toBe('a b');
    });

    it('should be trim empty space', () => {
        const result = clsx('a', ' ', 'b ');

        expect(result).toBe('a b');
    });

    it('handles all types of truthy and falsy property values as expected', () => {
        const result = clsx(
            // falsy:
            null,
            '',
            false,
            undefined,

            // truthy:
            'foobar',
            ' ',
            true
        );

        expect(result).toBe('foobar true');
    });
});
