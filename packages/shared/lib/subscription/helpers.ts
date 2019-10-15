import { PLAN_TYPES } from '../constants';

export const isManagedByMozilla = ({ CouponCode }: { CouponCode?: string | null } = {}) => {
    const coupon = CouponCode || ''; // CouponCode can be null
    return coupon.startsWith('MOZILLA') || coupon.startsWith('MOZTEST');
};

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
