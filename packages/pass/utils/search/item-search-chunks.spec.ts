import { getItemNameSearchChunks } from '@proton/pass/utils/search';

describe('getItemNameSearchChunks', () => {
    test('should return empty array if no search term', () => {
        expect(getItemNameSearchChunks('', '')).toEqual([]);
    });

    test('should not match if no term matches', () => {
        expect(getItemNameSearchChunks('my secure notes', 'nothing')).toEqual([]);
    });

    test('should return a single item with a correct match', () => {
        expect(getItemNameSearchChunks('my secure notes', 'my')).toEqual([
            {
                start: 0,
                end: 2,
            },
        ]);
    });

    test('should return all items with correct matches', () => {
        expect(getItemNameSearchChunks('my secure notes', 'my notes')).toEqual([
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
        expect(getItemNameSearchChunks('my secure notes', 'notes my')).toEqual([
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
        expect(getItemNameSearchChunks('my secure notes', 'my sec')).toEqual([
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
        expect(getItemNameSearchChunks('my secure notes', 'My SEc')).toEqual([
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
