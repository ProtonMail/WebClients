import { dateComparator, numberComparator, stringComparator } from './comparators';

describe('stringComparator', () => {
    it('should sort strings alphabetically', () => {
        expect(stringComparator('apple', 'banana')).toBeLessThan(0);
        expect(stringComparator('banana', 'apple')).toBeGreaterThan(0);
        expect(stringComparator('apple', 'apple')).toBe(0);
    });

    it('should handle numeric sorting in strings', () => {
        expect(stringComparator('file2', 'file10')).toBeLessThan(0);
        expect(stringComparator('file10', 'file2')).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
        expect(stringComparator('Apple', 'apple')).toBe(0);
        expect(stringComparator('BANANA', 'banana')).toBe(0);
    });

    it('should handle empty strings', () => {
        expect(stringComparator('', 'test')).toBeLessThan(0);
        expect(stringComparator('test', '')).toBeGreaterThan(0);
        expect(stringComparator('', '')).toBe(0);
    });
});

describe('numberComparator', () => {
    it('should sort numbers correctly', () => {
        expect(numberComparator(1, 2)).toBeLessThan(0);
        expect(numberComparator(2, 1)).toBeGreaterThan(0);
        expect(numberComparator(5, 5)).toBe(0);
    });

    it('should handle negative numbers', () => {
        expect(numberComparator(-5, 5)).toBeLessThan(0);
        expect(numberComparator(5, -5)).toBeGreaterThan(0);
        expect(numberComparator(-10, -5)).toBeLessThan(0);
    });

    it('should handle zero', () => {
        expect(numberComparator(0, 1)).toBeLessThan(0);
        expect(numberComparator(1, 0)).toBeGreaterThan(0);
        expect(numberComparator(0, 0)).toBe(0);
    });

    it('should handle decimals', () => {
        expect(numberComparator(1.5, 2.5)).toBeLessThan(0);
        expect(numberComparator(2.5, 1.5)).toBeGreaterThan(0);
    });
});

describe('dateComparator', () => {
    const date1 = new Date('2023-01-01');
    const date2 = new Date('2023-12-31');
    const date3 = new Date('2023-01-01');

    it('should sort dates chronologically', () => {
        expect(dateComparator(date1, date2)).toBeLessThan(0);
        expect(dateComparator(date2, date1)).toBeGreaterThan(0);
        expect(dateComparator(date1, date3)).toBe(0);
    });

    it('should handle undefined dates - undefined sorts to end', () => {
        expect(dateComparator(undefined, date1)).toBeGreaterThan(0);
        expect(dateComparator(date1, undefined)).toBeLessThan(0);
        expect(dateComparator(undefined, undefined)).toBe(0);
    });

    it('should handle mixed defined and undefined dates', () => {
        expect(dateComparator(date1, undefined)).toBeLessThan(0);
        expect(dateComparator(undefined, date2)).toBeGreaterThan(0);
    });

    it('should sort same timestamp dates as equal', () => {
        const dateA = new Date('2023-06-15T12:00:00Z');
        const dateB = new Date('2023-06-15T12:00:00Z');
        expect(dateComparator(dateA, dateB)).toBe(0);
    });
});
