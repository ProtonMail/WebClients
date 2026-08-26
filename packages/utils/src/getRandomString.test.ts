import { disableRandomMock, initRandomMock } from '@proton/testing/lib/mockRandomValues';

import getRandomString, { DEFAULT_CHARSET } from './getRandomString';

describe('getRandomString()', () => {
    const getConsecutiveArray = (length: number) => [...Array(length).keys()];

    const mockedRandomValues = jest
        .fn()
        .mockImplementation((array: Uint32Array) => Uint32Array.from(getConsecutiveArray(array.length)));

    beforeAll(() => initRandomMock(mockedRandomValues));
    afterAll(() => disableRandomMock());

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
            const result = getRandomString(DEFAULT_CHARSET.length);

            expect(mockedRandomValues).toHaveBeenCalled();
            expect(result).toBe(DEFAULT_CHARSET);
        });

        it('returns characters from the defined charset', () => {
            const charset = 'qwerty';

            const result = getRandomString(charset.length, charset);

            expect(result).toBe(charset);
        });
    });
});
