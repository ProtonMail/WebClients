import { buildSubscription } from '@proton/testing/builders';
import { getTestPlansMap } from '@proton/testing/data';

import { computeOptimisticCheckResult } from './computeOptimisticCheckResult';
import { CYCLE, PLANS } from './constants';
import { SubscriptionMode } from './subscription/constants';

describe('computeOptimisticCheckResult', () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-08-26T00:00:00.000Z'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should return check result that uses the computed susbcription mode and computed renew properties', () => {
        expect(
            computeOptimisticCheckResult(
                {
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                    cycle: CYCLE.TWO_YEARS,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription({
                    planName: PLANS.BUNDLE,
                    cycle: CYCLE.YEARLY,
                    currency: 'EUR',
                }),
                { isTrial: false }
            )
        ).toEqual({
            Amount: 19176,
            AmountDue: 19176,
            Coupon: null,
            CouponDiscount: 0,
            Credit: 0,
            Currency: 'EUR',
            Cycle: CYCLE.TWO_YEARS,
            Gift: 0,
            PeriodEnd: 1819238400, // 2027-08-26
            Proration: 0,
            optimistic: true,
            SubscriptionMode: SubscriptionMode.ScheduledChargedImmediately,
            BaseRenewAmount: 11988,
            RenewCycle: CYCLE.YEARLY,
            requestData: {
                Currency: 'EUR',
                Cycle: CYCLE.TWO_YEARS,
                Plans: {
                    [PLANS.BUNDLE]: 1,
                },
            },
        });
    });
});
