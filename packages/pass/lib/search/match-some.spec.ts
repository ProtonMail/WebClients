import { matchSome } from './match-some';

describe('matchSome', () => {
    describe('All needles match', () => {
        test('should return `true` if all needles are in the haystack', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes example.com')).toBe(true);
            expect(matcher('example.com my secure notes username title')).toBe(true);
        });

        test('should return `true` if needles partially match the haystack', () => {
            const needles = ['titl', 'user', 'secure', 'example'];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes example.com')).toBe(true);
        });

        test('should return `true` if needles match in any order', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('example.com title my secure notes username')).toBe(true);
            expect(matcher('username my secure notes example.com title')).toBe(true);
        });

        test('should return `true` if case-insensitive', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('Title Username My Secure Notes Example.com')).toBe(true);
        });
    });

    describe('Partial and No Matches', () => {
        test('should return `true` if any needle is missing from the haystack', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes')).toBe(true);
            expect(matcher('example.com my secure notes title')).toBe(true);
            expect(matcher('title username example.com')).toBe(true);
        });

        test('should return `false` if no needles match', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('nothing')).toBe(false);
            expect(matcher('important')).toBe(false);
        });

        test('should return `true` if any partial needle does not match', () => {
            const needles = ['titl', 'user', 'security', 'examp'];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes example')).toBe(true);
        });
    });

    describe('Special Cases', () => {
        test('should return `true` if needles match with extra whitespace', () => {
            const needles = ['title', 'username', 'my', 'secure-notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title   username   my   secure-notes   example.com')).toBe(true);
        });

        test('should return `true` for needles with special characters', () => {
            const needles = ['title!', 'user@name', 'my$secure^notes', 'example.com#'];
            const matcher = matchSome(needles);
            expect(matcher('title! user@name my$secure^notes example.com#')).toBe(true);
        });

        test('should return `true` if newline-separated needles are all present', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title\nusername\nmy secure notes\nexample.com')).toBe(true);
        });

        test('should return `true` if extra whitespace in haystack', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('  title   username   my secure notes   example.com  ')).toBe(true);
        });

        test('should return `true` if any newline-separated needle does not match', () => {
            const needles = ['title', 'username', 'my secure notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title\nusername\nmy secure notes')).toBe(true);
        });

        test('should return `false` if special characters do not match', () => {
            const needles = ['title!', 'user@name', 'my$secure^notes', 'example.com#'];
            const matcher = matchSome(needles);
            expect(matcher('title user name my secure notes example.com')).toBe(false);
        });

        test('should return `false` for non-normalized needles', () => {
            const needles = ['Title', 'Username', 'My Secure Notes', 'Example.com'];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes example.com')).toBe(false);
        });

        test('should return `false` if empty needles', () => {
            const needles: string[] = [];
            const matcher = matchSome(needles);
            expect(matcher('title username my secure notes example.com')).toBe(false);
        });

        test('should return `false` for empty haystack with empty needles', () => {
            const needles: string[] = [];
            const matcher = matchSome(needles);
            expect(matcher('')).toBe(false);
        });

        test('should return `false` for empty haystack with non-empty needles', () => {
            const needles = ['title', 'username', 'my', 'secure-notes', 'example.com'];
            const matcher = matchSome(needles);
            expect(matcher('')).toBe(false);
        });
    });
});
