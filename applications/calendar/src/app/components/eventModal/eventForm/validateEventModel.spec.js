import { getExcessiveNotificationsIndices } from './validateEventModel';

describe('getExcessiveNotificationsIndices()', () => {
    it('should correctly identify notifications exceeding the MAX_NOTIFICATION limit', () => {
        const result = getExcessiveNotificationsIndices([1, 2, 3, 4, 5, 6, 7], 3);
        expect(result).toStrictEqual([3, 4, 5, 6]);
    });
});
