import { buildSubscription } from '@proton/testing/builders';
import { getTestPlansMap } from '@proton/testing/data';

import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '../../core/constants';
import { SubscriptionMode } from '../../core/subscription/constants';
import {
    computeOptimisticCheckResult,
    computeOptimisticRenewProperties,
    computeOptimisticSubscriptionMode,
} from './PaymentContext';

describe('computeOptimisticSubscriptionMode', () => {
    it('should return regular subscription mode if user has a free subscription', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                FREE_SUBSCRIPTION,
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.Regular);
    });

    it('should return trial subscription mode if user has a free subscription and requests a trial', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.MAIL]: 1,
                    },
                    cycle: CYCLE.MONTHLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                FREE_SUBSCRIPTION,
                { isTrial: true }
            )
        ).toEqual(SubscriptionMode.Trial);
    });

    it('should return regular subscription mode if user switches to another plan', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                    cycle: CYCLE.MONTHLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription(PLANS.MAIL),
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.Regular);
    });

    it('should return custom billings mode if user adds addons', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.MAIL_BUSINESS]: 1,
                        [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 1,
                    },
                    cycle: CYCLE.MONTHLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription({
                    [PLANS.MAIL_BUSINESS]: 1,
                }),
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.CustomBillings);
    });

    it('should return ScheduledChargedLater mode if user decreases the number of addons', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.MAIL_BUSINESS]: 1,
                    },
                    cycle: CYCLE.MONTHLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription({
                    [PLANS.MAIL_BUSINESS]: 1,
                    [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 1,
                }),
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.ScheduledChargedLater);
    });

    it('should return ScheduledChargedImmediately mode if user switches to a higher cycle', () => {
        expect(
            computeOptimisticSubscriptionMode(
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
        ).toEqual(SubscriptionMode.ScheduledChargedImmediately);
    });

    it('should return ScheduledChargedLater mode if user switches to a lower cycle', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription({
                    planName: PLANS.BUNDLE,
                    cycle: CYCLE.TWO_YEARS,
                    currency: 'EUR',
                }),
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.ScheduledChargedLater);
    });

    it('should return regular subscription mode if user changes currency', () => {
        expect(
            computeOptimisticSubscriptionMode(
                {
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                    cycle: CYCLE.YEARLY,
                    currency: 'EUR',
                    plansMap: getTestPlansMap('EUR'),
                },
                buildSubscription({
                    planName: PLANS.BUNDLE,
                    cycle: CYCLE.TWO_YEARS,
                    currency: 'USD',
                }),
                { isTrial: false }
            )
        ).toEqual(SubscriptionMode.Regular);
    });
});

describe('computeOptimisticRenewProperties', () => {
    it('should return renew properties if users selects a plan with a variable cycle offer', () => {
        const currency = 'EUR';

        expect(
            computeOptimisticRenewProperties({
                planIDs: {
                    [PLANS.BUNDLE]: 1,
                },
                cycle: CYCLE.TWO_YEARS,
                currency,
                plansMap: getTestPlansMap(currency),
            })
        ).toEqual({
            BaseRenewAmount: 11988,
            RenewCycle: CYCLE.YEARLY,
        });
    });

    it('should return null if users selects a plan without a variable cycle offer', () => {
        const currency = 'EUR';

        expect(
            computeOptimisticRenewProperties({
                planIDs: {
                    [PLANS.BUNDLE]: 1,
                },
                cycle: CYCLE.YEARLY,
                currency,
                plansMap: getTestPlansMap(currency),
            })
        ).toEqual(null);
    });
});

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
