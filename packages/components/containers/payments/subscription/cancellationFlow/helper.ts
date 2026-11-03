import type { Subscription } from '@proton/payments/core/subscription/interface';

export const CANCEL_ROUTE = '/cancel-subscription';

const SUBSCRIPTION_ID_PARAM = 'subscriptionId';

export const getCancelRoute = (subscription: Subscription) => {
    const params = new URLSearchParams({ [SUBSCRIPTION_ID_PARAM]: subscription.ID });
    return `${CANCEL_ROUTE}?${params.toString()}`;
};

const getSubscriptionIdFromCancelRoute = (search: string) => {
    return new URLSearchParams(search).get(SUBSCRIPTION_ID_PARAM) ?? undefined;
};

const getOnlySubscription = (subscriptions: Subscription[]) => {
    return subscriptions.length === 1 ? subscriptions[0] : undefined;
};

export const getSubscriptionForCancelRoute = (subscriptions: Subscription[], search: string) => {
    const subscriptionId = getSubscriptionIdFromCancelRoute(search);
    if (subscriptionId === undefined) {
        return getOnlySubscription(subscriptions);
    }

    return subscriptions.find(({ ID }) => ID === subscriptionId);
};
