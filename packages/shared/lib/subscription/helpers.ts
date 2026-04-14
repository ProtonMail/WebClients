import { PLAN_TYPES, Renew } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';

interface SubcriptionPlan {
    Type: PLAN_TYPES;
    Title: string;
}

export const getSubscriptionPlans = <P extends SubcriptionPlan>({ Plans = [] }: { Plans: P[] }) =>
    Plans.filter(({ Type }) => Type === PLAN_TYPES.PLAN);

export const getSubscriptionTitle = <P extends SubcriptionPlan>({ Plans = [] }: { Plans: P[] }) => {
    return getSubscriptionPlans({ Plans })
        .map(({ Title }) => Title)
        .join(', ');
};

export const isSubscriptionRenewEnabled = (subscription: MaybeFreeSubscription): boolean => {
    if (subscription?.UpcomingSubscription) {
        return subscription?.UpcomingSubscription.Renew === Renew.Enabled;
    }
    return isPaidSubscription(subscription) ? subscription.Renew === Renew.Enabled : false;
};
