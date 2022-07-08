import isArrayOfUint8Array from './isArrayOfUint8Array';

describe('isArrayOfUint8Array()', () => {
    it('returns true if array is empty', () => {
        const result = isArrayOfUint8Array([]);

        expect(result).toBe(true);
    });

    it('returns true if every item is an instance of Uint8Array', () => {
        const result = isArrayOfUint8Array([new Uint8Array(1), new Uint8Array(2), new Uint8Array(3)]);

        expect(result).toBe(true);
    });

    it('returns false if any item is  not an instance of Uint8Array', () => {
        const result = isArrayOfUint8Array([new Uint8Array(1), 'not instance of Uint8Array', new Uint8Array(3)]);

        expect(result).toBe(false);
    });
});
