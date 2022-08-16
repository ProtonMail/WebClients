import { getMatches } from '../../lib/helpers/regex';

describe('getMatches', () => {
    it('should return an empty array if the regex does not match', () => {
        const regex = /foo/;
        const b = 'bar';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([]);
    });

    it('should return an array of MatchChunk objects', () => {
        const regex = /foo/;
        const b = 'foo bar';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([{ start: 0, end: 3 }]);
    });

    it('should return an array of MatchChunk objects', () => {
        const regex = /foo/;
        const b = 'foo bar foo';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([
            { start: 0, end: 3 },
            { start: 6, end: 9 },
        ]);
    });

    it('should return an array of MatchChunk objects', () => {
        const regex = /foo/;
        const b = 'foo bar foo bar';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([
            { start: 0, end: 3 },
            { start: 6, end: 9 },
            { start: 12, end: 15 },
        ]);
    });
});
