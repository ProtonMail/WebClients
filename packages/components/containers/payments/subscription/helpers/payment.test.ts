import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments';
import { Renew } from '@proton/shared/lib/interfaces';
import { PLANS_MAP, subscriptionMock, upcomingSubscriptionMock } from '@proton/testing/data';

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
        expect(subscriptionExpires(subscriptionMock)).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should handle expiring subscription', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                Renew: Renew.Disabled,
            })
        ).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscriptionMock.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription expires', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                UpcomingSubscription: {
                    ...upcomingSubscriptionMock,
                    Renew: Renew.Disabled,
                },
            })
        ).toEqual({
            subscriptionExpiresSoon: true,
            planName: 'Proton Unlimited',
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: upcomingSubscriptionMock.PeriodEnd,
        });
    });

    it('should handle the case when the upcoming subscription does not expire', () => {
        expect(
            subscriptionExpires({
                ...subscriptionMock,
                UpcomingSubscription: {
                    ...upcomingSubscriptionMock,
                    Renew: Renew.Enabled,
                },
            })
        ).toEqual({
            subscriptionExpiresSoon: false,
            planName: 'Proton Unlimited',
            renewDisabled: false,
            renewEnabled: true,
            expirationDate: null,
        });
    });

    it('should ignore upcoming subscription if the current subscription is cancelled', () => {
        expect(subscriptionExpires({ ...subscriptionMock, Renew: Renew.Disabled })).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscriptionMock.PeriodEnd,
            planName: 'Proton Unlimited',
        });

        expect(subscriptionExpires(subscriptionMock, true)).toEqual({
            subscriptionExpiresSoon: true,
            renewDisabled: true,
            renewEnabled: false,
            expirationDate: subscriptionMock.PeriodEnd,
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
            plan: PLANS.WALLET,
            cycle: CYCLE.TWO_YEARS,
            expected: CYCLE.YEARLY,
        },
        {
            plan: PLANS.WALLET,
            cycle: CYCLE.YEARLY,
            expected: CYCLE.YEARLY,
        },
    ])('should cap cycle if the backend does not have available higher cycles', ({ plan, cycle, expected }) => {
        expect(notHigherThanAvailableOnBackend({ [plan]: 1 }, PLANS_MAP, cycle)).toEqual(expected);
    });
});
