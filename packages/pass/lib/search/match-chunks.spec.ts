import { matchChunks } from './match-chunks';

describe('getItemNameSearchChunks', () => {
    test('should return empty array if no search term', () => {
        expect(matchChunks('', '')).toEqual([]);
    });

    test('should not match if no term matches', () => {
        expect(matchChunks('my secure notes', 'nothing')).toEqual([]);
    });

    test('should return a single item with a correct match', () => {
        expect(matchChunks('my secure notes', 'my')).toEqual([
            {
                start: 0,
                end: 2,
            },
        ]);
    });

    test('should return all items with correct matches', () => {
        expect(matchChunks('my secure notes', 'my notes')).toEqual([
            {
                start: 0,
                end: 2,
            },
            {
                start: 10,
                end: 15,
            },
        ]);
    });

    test('should return all items with correct matches in any order', () => {
        expect(matchChunks('my secure notes', 'notes my')).toEqual([
            {
                start: 0,
                end: 2,
            },
            {
                start: 10,
                end: 15,
            },
        ]);
    });

    test('should match partial terms', () => {
        expect(matchChunks('my secure notes', 'my sec')).toEqual([
            {
                start: 0,
                end: 2,
            },
            {
                start: 3,
                end: 6,
            },
        ]);
    });

    test('should be case-insensitive', () => {
        expect(matchChunks('my secure notes', 'My SEc')).toEqual([
            {
                start: 0,
                end: 2,
            },
            {
                start: 3,
                end: 6,
            },
        ]);
    });
});
