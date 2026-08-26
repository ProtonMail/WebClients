import partition from './partition';

describe('partition()', () => {
    it('returns empty arrays if array is empty', () => {
        const array: string[] = [];
        const predicate = (item: string): item is string => {
            return typeof item === 'string';
        };

        const result = partition(array, predicate);

        expect(result).toStrictEqual([[], []]);
    });

    it('partitions items that fit the predicate into the first array', () => {
        const array: any[] = ['string 0', 'string 1', 0, 1, undefined, null, 'string 2', 2, 'string 3'];
        const predicate = (item: string): item is string => {
            return typeof item === 'string';
        };

        const result = partition(array, predicate);

        expect(result).toStrictEqual([
            ['string 0', 'string 1', 'string 2', 'string 3'],
            [0, 1, undefined, null, 2],
        ]);
    });
});
