import { subDays } from 'date-fns';

import extraSpaceGift from './extraSpaceGift';

function generateCreateTime(dayBefore = 0) {
    const date = subDays(new Date(), dayBefore);
    return Math.round(date.getTime() / 1000);
}

describe('extraSpaceGift', () => {
    it('returns not available for paid account', () => {
        expect(extraSpaceGift({ isFree: false, CreateTime: generateCreateTime(), MaxSpace: 0 })).toBe(0);
    });

    it('returns not available for old account', () => {
        expect(extraSpaceGift({ isFree: true, CreateTime: generateCreateTime(31), MaxSpace: 0 })).toBe(0);
    });

    it('returns not available for account with big storage', () => {
        expect(extraSpaceGift({ isFree: true, CreateTime: generateCreateTime(), MaxSpace: 1024 * 1024 * 1024 })).toBe(
            0
        );
    });

    it('returns available gift', () => {
        expect(extraSpaceGift({ isFree: true, CreateTime: generateCreateTime(10), MaxSpace: 500 * 1024 * 1024 })).toBe(
            20
        );
    });
});
