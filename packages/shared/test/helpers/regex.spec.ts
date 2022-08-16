import { getMatches } from '../../lib/helpers/regex';

describe('getMatches', () => {
    const regex = /foo/g;
    it('should return an empty array if the regex does not match', () => {
        const b = 'bar';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([]);
    });

    it('should return an array of MatchChunk objects', () => {
        const b = 'foo bar';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([{ start: 0, end: 3 }]);
    });

    it('should return an array of MatchChunk objects', () => {
        const b = 'foo bar foo';
        const matches = getMatches(regex, b);
        expect(matches).toEqual([
            { start: 0, end: 3 },
            { start: 8, end: 11 },
        ]);
    });
});
