import { buildSubscription } from '@proton/testing/builders';
import { getTestPlansMap } from '@proton/testing/data';

import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from './constants';
import { computeOptimisticSubscriptionMode } from './optimisticSubscriptionMode';
import { SubscriptionMode } from './subscription/constants';

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
