import { CYCLE } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';

import { DealWithPrices } from '../interface';
import { getDiscount, getDiscountWithCoupon } from './dealPrices';

describe('getDiscountWithCoupon', () => {
    it('should return discount', () => {
        expect(
            getDiscountWithCoupon({
                cycle: CYCLE.YEARLY,
                prices: {
                    withCoupon: 44,
                    withoutCouponMonthly: 77,
                },
            } as DealWithPrices)
        ).toBe(95);
    });

    it('should return custom discount for 15 months', () => {
        expect(
            getDiscountWithCoupon({
                cycle: getNormalCycleFromCustomCycle(CYCLE.FIFTEEN),
                prices: {
                    withCoupon: 7188,
                    withoutCoupon: 14985,
                    withoutCouponMonthly: 999,
                },
            } as DealWithPrices)
        ).toBe(40);
    });

    it('should return custom discount for 30 months', () => {
        expect(
            getDiscountWithCoupon({
                cycle: getNormalCycleFromCustomCycle(CYCLE.THIRTY),
                prices: {
                    withCoupon: 11976,
                    withoutCoupon: 29970,
                    withoutCouponMonthly: 999,
                },
            } as DealWithPrices)
        ).toBe(50);
    });
});

describe('getDiscount', () => {
    it('should return discount', () => {
        expect(
            getDiscount({
                cycle: CYCLE.YEARLY,
                prices: {
                    withoutCoupon: 44,
                    withoutCouponMonthly: 77,
                },
            } as DealWithPrices)
        ).toBe(95);
    });
});
