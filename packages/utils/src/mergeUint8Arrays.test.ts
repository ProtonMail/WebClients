import mergeUint8Arrays from './mergeUint8Arrays';

describe('mergeUint8Arrays()', () => {
    it('returns empty array if arrays is empty', () => {
        const arrays: Uint8Array<ArrayBuffer>[] = [];

        const result = mergeUint8Arrays(arrays);

        expect(result).toStrictEqual(new Uint8Array());
    });

    it('merges Uint8Array', () => {
        const arrays = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])];

        const result = mergeUint8Arrays(arrays);

        expect(result).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
    });
});
