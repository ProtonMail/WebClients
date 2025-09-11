import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { addApiMock } from '@proton/testing';
import { buildSubscription } from '@proton/testing/builders';

export const subscriptionDefaultResponse: {
    Code: Number;
    Subscription: Subscription;
    UpcomingSubscription: Subscription | null;
} = {
    Code: 1000,
    Subscription: buildSubscription({
        planName: PLANS.BUNDLE,
        currency: 'CHF',
        cycle: CYCLE.YEARLY,
    }),
    UpcomingSubscription: null,
};

export function mockSubscriptionApi(subscription: typeof subscriptionDefaultResponse = subscriptionDefaultResponse) {
    addApiMock('payments/v5/subscription', () => subscription);
}

export const defaultSubscriptionCache = formatSubscription(
    subscriptionDefaultResponse.Subscription,
    subscriptionDefaultResponse.UpcomingSubscription,
    undefined
);
