import { sortItemsWithPositions } from './sortItemsWithPositions';

describe('sortItemsWithPositions', () => {
    it('should sort items based on the provided positions', () => {
        const items = [
            { rootShareId: 'browserItem1' },
            { rootShareId: 'browserItem2' },
            { rootShareId: 'browserItem3' },
            { rootShareId: 'browserItem4' },
        ];

        const positionsWithShareId = new Map([
            ['browserItem3', 0],
            ['browserItem1', 2],
        ]);

        const result = sortItemsWithPositions(items, positionsWithShareId);

        expect(result.map((item) => item.rootShareId)).toEqual([
            'browserItem3',
            'browserItem2',
            'browserItem1',
            'browserItem4',
        ]);
    });

    it('should ignore positions for non-existent items', () => {
        const items = [{ rootShareId: 'browserItem1' }, { rootShareId: 'browserItem2' }];
        const positionsWithShareId = new Map([['browserItem3', 0]]);

        const result = sortItemsWithPositions(items, positionsWithShareId);

        expect(result).toEqual(items);
    });

    it('should handle positions larger than the array length', () => {
        const items = [
            { rootShareId: 'browserItem1' },
            { rootShareId: 'browserItem2' },
            { rootShareId: 'browserItem3' },
        ];
        const positionsWithShareId = new Map([['browserItem2', 5]]);

        const result = sortItemsWithPositions(items, positionsWithShareId);

        expect(result.map((item) => item.rootShareId)).toEqual(['browserItem1', 'browserItem3', 'browserItem2']);
    });
});
