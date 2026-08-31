import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import formatSubscription from '@proton/shared/lib/subscription/format';
import { addApiMock } from '@proton/testing/lib/api';

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
    addApiMock('payments/v4/subscription', () => subscription);
}

export const defaultSubscriptionCache = formatSubscription(
    subscriptionDefaultResponse.Subscription,
    subscriptionDefaultResponse.UpcomingSubscription,
    undefined
);
