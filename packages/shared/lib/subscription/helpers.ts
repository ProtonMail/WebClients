import type { Subscription } from '@proton/payments';
import { PLAN_TYPES, Renew } from '@proton/payments';

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

export const isSubscriptionRenewEnabled = (subscription: Subscription | undefined) => {
    if (subscription?.UpcomingSubscription) {
        return subscription?.UpcomingSubscription.Renew === Renew.Enabled;
    }
    return subscription?.Renew === Renew.Enabled;
};
