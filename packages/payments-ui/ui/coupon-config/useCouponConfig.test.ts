import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

import type { CouponConfig } from './interface';
import { useCouponConfig } from './useCouponConfig';

const testMonthlyNudgeConfig: CouponConfig = {
    coupons: ['ANNUALOFFER25'],
    hidden: true,
    cyclePriceCompare: undefined,
    cycleTitle: undefined,
};

describe('useCouponConfig', () => {
    it('returns rendered config with render functions when a config matches', () => {
        const checkResult: SubscriptionEstimation = {
            Amount: 9999,
            AmountDue: 7499,
            Coupon: {
                Code: 'ANNUALOFFER25',
                Description: 'Annual offer 25% discount',
                MaximumRedemptionsPerUser: 1,
            },
            CouponDiscount: 2500,
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
            PeriodEnd: 1735689600,
            SubscriptionMode: 0,
            BaseRenewAmount: 9999,
            RenewCycle: CYCLE.YEARLY,
            requestData: {
                Plans: { [PLANS.MAIL]: 1 },
                Currency: 'USD',
                Cycle: CYCLE.YEARLY,
            },
        };

        const result = useCouponConfig(
            {
                checkResult,
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap: {},
            },
            [testMonthlyNudgeConfig]
        );

        expect(result?.hidden).toBe(true);
        expect(result?.renderPayCTA).toBeUndefined();
    });
});
