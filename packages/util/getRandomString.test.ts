import getRandomValues from '@proton/get-random-values';
import getRandomString, { DEFAULT_CHARSET } from './getRandomString';

jest.mock('@proton/get-random-values');

const getConsecutiveArray = (length: number) => [...Array(length).keys()];

// @ts-ignore
getRandomValues.mockImplementation((array: Uint32Array) => Uint8Array.from(getConsecutiveArray(array.length)));

describe('getRandomString()', () => {
    describe('length', () => {
        it('returns throw an error when length is negative', () => {
            expect(() => getRandomString(-1)).toThrow();
        });
        it('returns an empty string when length is 0', () => {
            const result = getRandomString(0);
            expect(result).toBe('');
        });
        it('returns a string of required length', () => {
            const lengths = [1, 2, 3, 5, 8, 13];
            const results = lengths.map((length) => getRandomString(length));
            expect(results.map((result) => result.length)).toStrictEqual(lengths);
        });
    });

    describe('charset', () => {
        it('defaults the charset', () => {
            // @ts-ignore
            // Mock consecutive array [0, 1, 2, 3....] so that we can determine the charset used
            getRandomValues.mockImplementation((array: Uint32Array) =>
                Uint8Array.from(getConsecutiveArray(array.length))
            );

            const result = getRandomString(DEFAULT_CHARSET.length);

            expect(getRandomValues).toHaveBeenCalled();
            expect(result).toBe(DEFAULT_CHARSET);
        });

        it('returns characters from the defined charset', () => {
            const charset = 'qwerty';

            // @ts-ignore
            getRandomValues.mockImplementation((array: Uint32Array) =>
                Uint8Array.from(getConsecutiveArray(array.length))
            );

            const result = getRandomString(charset.length, charset);

            expect(result).toBe(charset);
        });
    });
});
