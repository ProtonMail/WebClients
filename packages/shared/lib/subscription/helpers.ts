import { PLAN_TYPES } from '../payments/constants';
import { Renew } from '../payments/subscription/constants';
import type { MaybeFreeSubscription } from '../payments/subscription/interface';
import { isPaidSubscription } from '../payments/type-guards';

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
