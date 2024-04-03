import { deduplicate } from './duplicate';

describe('deduplicate function', () => {
    it('should remove duplicate items based on provided equality function', () => {
        const eq = (a: number) => (b: number) => a === b;
        const arr = [1, 2, 2, 3, 3, 3];
        expect(deduplicate(arr, eq)).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
        const eq = (a: string) => (b: string) => a === b;
        const arr: string[] = [];
        expect(deduplicate(arr, eq)).toEqual([]);
    });

    it('should handle custom equality function', () => {
        type TestItem = { itemId: number; shareId: number };
        const eq = (a: TestItem) => (b: TestItem) => a.itemId === b.itemId && a.shareId === b.shareId;

        const arr: TestItem[] = [
            { itemId: 0, shareId: 1 },
            { itemId: 1, shareId: 2 },
            { itemId: 1, shareId: 2 },
        ];

        expect(deduplicate(arr, eq)).toEqual([
            { itemId: 0, shareId: 1 },
            { itemId: 1, shareId: 2 },
        ]);
    });
});
