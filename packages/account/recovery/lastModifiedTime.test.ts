import { getLastModifiedDate } from './lastModifiedTime';

describe('getLastModifiedDate', () => {
    it('returns null when never modified', () => {
        expect(getLastModifiedDate(null)).toBe(null);
        expect(getLastModifiedDate(undefined)).toBe(null);
        expect(getLastModifiedDate(0)).toBe(null);
    });

    it('converts a unix timestamp to a date', () => {
        expect(getLastModifiedDate(1786358336)).toEqual(new Date(1786358336 * 1000));
    });
});
