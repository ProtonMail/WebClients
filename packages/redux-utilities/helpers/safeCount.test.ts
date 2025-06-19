import { safeDecreaseCount, safeIncreaseCount } from './safeCount';

describe('safeDecreaseCount', () => {
    it('should return 0 if parameters are undefined', () => {
        expect(safeDecreaseCount()).toBe(0);
    });

    it('should decrement by 1 by default', () => {
        expect(safeDecreaseCount(1)).toBe(0);
    });

    it('should return 0 if currentUnread is 0', () => {
        expect(safeDecreaseCount(0, 1)).toBe(0);
    });

    it('should decrement correctly', () => {
        expect(safeDecreaseCount(5, 2)).toBe(3);
    });

    it('should not go below 0', () => {
        expect(safeDecreaseCount(1, 2)).toBe(0);
    });
});

describe('safeIncreaseCount', () => {
    it('should return 1 if parameters are undefined', () => {
        expect(safeIncreaseCount()).toBe(1);
    });

    it('should increment by 1 by default', () => {
        expect(safeIncreaseCount(1)).toBe(2);
    });

    it('should increment from 0', () => {
        expect(safeIncreaseCount(0, 1)).toBe(1);
    });

    it('should increment correctly', () => {
        expect(safeIncreaseCount(5, 2)).toBe(7);
    });
});
