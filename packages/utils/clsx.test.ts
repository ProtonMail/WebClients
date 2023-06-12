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

    it('trims empty space', () => {
        const result = clsx('foo bar', ' ', 'foobar');

        expect(result).toBe('foo bar foobar');
    });

    it('keeps only non-blank strings', () => {
        const result = clsx(null, '', false, undefined, 'foobar', ' ', true);

        expect(result).toBe('foobar');
    });
});
