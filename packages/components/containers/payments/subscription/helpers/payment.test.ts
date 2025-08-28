import { CYCLE, FREE_SUBSCRIPTION, PLANS, Renew } from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { notHigherThanAvailableOnBackend, subscriptionExpires } from './payment';

describe('subscriptionExpires()', () => {
    it('should handle the case when subscription is not loaded yet', () => {
        expect(subscriptionExpires()).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle the case when subscription is free', () => {
        expect(subscriptionExpires(FREE_SUBSCRIPTION as any)).toEqual({
            subscriptionExpiresSoon: false,
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle non-expiring subscription', () => {
        expect(subscriptionExpires(buildSubscription())).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle expiring subscription', () => {
        const subscription = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription expires', () => {
        const subscription = buildSubscription();
        const upcoming = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });
        subscription.UpcomingSubscription = upcoming;

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: upcoming.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription does not expire', () => {
        const subscription = buildSubscription();
        const upcoming = buildSubscription(undefined, {
            Renew: Renew.Enabled,
        });
        subscription.UpcomingSubscription = upcoming;

        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should ignore upcoming subscription if the current subscription is cancelled', () => {
        const subscription = buildSubscription(undefined, {
            Renew: Renew.Disabled,
        });
        expect(subscriptionExpires(subscription)).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
            planName: 'Proton Unlimited',
        });

        expect(subscriptionExpires(subscription, true)).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscription.PeriodEnd,
            planName: 'Proton Unlimited',
        });
    });
});

describe('notHigherThanAvailableOnBackend', () => {
    it('should return current cycle if plan does not exist in the planIDs', () => {
        expect(notHigherThanAvailableOnBackend({}, PLANS_MAP, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it('should return current cycle if plan does not exist in the plansMap', () => {
        expect(notHigherThanAvailableOnBackend({ [PLANS.MAIL]: 1 }, {}, CYCLE.MONTHLY)).toEqual(CYCLE.MONTHLY);
    });

    it.each([CYCLE.MONTHLY, CYCLE.THIRTY, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY])(
        'should return current cycle if it is not higher than available on backend',
        (cycle) => {
            expect(notHigherThanAvailableOnBackend({ [PLANS.VPN2024]: 1 }, PLANS_MAP, cycle)).toEqual(cycle);
        }
    );

    it.each([
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.THIRTY,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.TWO_YEARS,
        },
        {
            plan: PLANS.MAIL,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.DRIVE_1TB,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.DRIVE_1TB,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
    ])('should cap cycle if the backend does not have available higher cycles', ({ plan, cycle, expected }) => {
        expect(notHigherThanAvailableOnBackend({ [plan]: 1 }, PLANS_MAP, cycle)).toEqual(expected);
    });
});
