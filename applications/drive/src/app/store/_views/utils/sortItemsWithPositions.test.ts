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

    it('should sort items based on the provided positions', () => {
        const items = [
            { rootShareId: 'browserItem1' },
            { rootShareId: 'browserItem2' },
            { rootShareId: 'browserItem3' },
            { rootShareId: 'browserItem4' },
        ];

        const positionsWithShareId = new Map([
            ['browserItem1', 2],
            ['browserItem3', 0],
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

    it('should maintain original order for items without specified positions', () => {
        const items = [
            { rootShareId: 'browserItem1' },
            { rootShareId: 'browserItem2' },
            { rootShareId: 'browserItem3' },
            { rootShareId: 'browserItem4' },
        ];

        const positionsWithShareId = new Map<string, number>([['browserItem4', 0]]);

        const result = sortItemsWithPositions(items, positionsWithShareId);

        expect(result.map((item) => item.rootShareId)).toEqual([
            'browserItem4',
            'browserItem1',
            'browserItem2',
            'browserItem3',
        ]);
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

    it('should handle if there is empty items array', () => {
        const items: { rootShareId: string }[] = [];
        const positionsWithShareId = new Map([['browserItem2', 5]]);

        const result = sortItemsWithPositions(items, positionsWithShareId);

        expect(result.map((item) => item.rootShareId)).toEqual([]);
    });
});
