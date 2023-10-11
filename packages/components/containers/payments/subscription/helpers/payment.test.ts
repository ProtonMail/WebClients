import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/interfaces';
import { subscriptionMock, upcomingSubscriptionMock } from '@proton/testing/data';

import { subscriptionExpires } from './payment';

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
});
