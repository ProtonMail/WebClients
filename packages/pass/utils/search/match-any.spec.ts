import { matchAny } from './match-any';

describe('matchAny', () => {
    test('should return true if any term matches', () => {
        const terms = ['title', 'username', 'my secure notes', 'example.com'];
        const matcher = matchAny(terms);

        expect(matcher('title')).toBe(true);
        expect(matcher('username')).toBe(true);
        expect(matcher('my secure notes')).toBe(true);
        expect(matcher('example.com')).toBe(true);
    });

    test('should match terms in any order', () => {
        const terms = ['title', 'username', 'my secure notes', 'example.com'];
        const matcher = matchAny(terms);

        expect(matcher('my notes secure')).toBe(true);
        expect(matcher('title username')).toBe(true);
        expect(matcher('username title')).toBe(true);
    });

    test('should return false if no terms match', () => {
        const terms = ['title', 'username', 'my secure notes', 'example.com'];
        const matcher = matchAny(terms);

        expect(matcher('nothing')).toBe(false);
        expect(matcher('titles')).toBe(false);
    });

    test('should be case-insensitive', () => {
        const terms = ['title', 'username', 'my secure notes', 'example.com'];
        const matcher = matchAny(terms);

        expect(matcher('Title')).toBe(true);
        expect(matcher('userNAME')).toBe(true);
        expect(matcher('secure NoTES')).toBe(true);
    });

    test('should match partial terms', () => {
        const terms = ['title', 'username', 'my secure notes', 'example.com'];
        const matcher = matchAny(terms);

        expect(matcher('titl')).toBe(true);
        expect(matcher('secure')).toBe(true);
        expect(matcher('.com')).toBe(true);
        expect(matcher('.')).toBe(true);
    });

    test('should match newline-separated terms', () => {
        const terms = ['title\nusername\nmy secure notes\nexample.com'];
        const matcher = matchAny(terms);

        expect(matcher('titl')).toBe(true);
        expect(matcher('my notes secure')).toBe(true);
        expect(matcher('title username')).toBe(true);
        expect(matcher('username title')).toBe(true);
        expect(matcher('nothing')).toBe(false);
        expect(matcher('titles')).toBe(false);
    });
});
