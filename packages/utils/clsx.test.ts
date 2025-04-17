import clsx from './clsx';

describe('clsx()', () => {
    it('handles array arguments', () => {
        const result = clsx(['a', 'b']);

        expect(result).toBe('a b');
    });

    it('handles object arguments', () => {
        const result = clsx({ a: true, ' ': true, b: false }, { c: undefined, d: null }, {
            e: 1,
            f: () => {},
            g: 'g',
        } as any);

        expect(result).toBe('a e f g');
    });

    it('returns empty string when empty array is passed', () => {
        const result = clsx([]);

        expect(result).toBe('');
    });

    it('returns empty string when empty object is passed', () => {
        const result = clsx({});

        expect(result).toBe('');
    });

    it('returns empty string when empty string is passed', () => {
        const result = clsx('');

        expect(result).toBe('');
    });

    it('extracts and joins classes correctly', () => {
        const result = clsx('a', 'b', ['c', 'd'], { e: true, f: true });

        expect(result).toBe('a b c d e f');
    });

    it('trims spaces', () => {
        const result = clsx('foo bar ', ' ', ' foobar');

        expect(result).toBe('foo bar foobar');
    });

    it('keeps only non-blank strings', () => {
        const result = clsx(null, '', false, undefined, 'foobar', ' ', true, [], {});

        expect(result).toBe('foobar');
    });
});
