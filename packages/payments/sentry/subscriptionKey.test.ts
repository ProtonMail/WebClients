import { CYCLE, FREE_SUBSCRIPTION, PLANS, PLAN_TYPES } from '../core/constants';
import type { Subscription } from '../core/subscription/interface';
import { getSubscriptionKeys } from './subscriptionKey';

const buildSubscription = (plan: PLANS, currency: string, cycle: CYCLE, upcoming?: Subscription) =>
    ({
        Cycle: cycle,
        Currency: currency,
        Plans: [{ Name: plan, Type: PLAN_TYPES.PLAN, Quantity: 1 }],
        UpcomingSubscription: upcoming,
    }) as unknown as Subscription;

describe('getSubscriptionKeys', () => {
    it('should build the key from plan name, currency and cycle', () => {
        expect(getSubscriptionKeys(buildSubscription(PLANS.MAIL, 'EUR', CYCLE.MONTHLY))).toEqual({
            subscriptionKey: 'mail2022-EUR-1m',
            upcomingSubscriptionKey: null,
        });
    });

    it('should report the upcoming subscription separately', () => {
        const upcoming = buildSubscription(PLANS.BUNDLE, 'CHF', CYCLE.YEARLY);

        expect(getSubscriptionKeys(buildSubscription(PLANS.MAIL, 'CHF', CYCLE.MONTHLY, upcoming))).toEqual({
            subscriptionKey: 'mail2022-CHF-1m',
            upcomingSubscriptionKey: 'bundle2022-CHF-12m',
        });
    });

    it.each([
        ['a free subscription', FREE_SUBSCRIPTION],
        ['an absent subscription', undefined],
    ])('should report %s as null', (_label, subscription) => {
        expect(getSubscriptionKeys(subscription)).toEqual({
            subscriptionKey: null,
            upcomingSubscriptionKey: null,
        });
    });

    it('should report null when the subscription carries no plan', () => {
        expect(
            getSubscriptionKeys({ Cycle: CYCLE.MONTHLY, Currency: 'EUR', Plans: [] } as unknown as Subscription)
        ).toEqual({ subscriptionKey: null, upcomingSubscriptionKey: null });
    });
});
