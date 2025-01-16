import { PLAN_TYPES } from '@proton/payments';

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
