import { PLAN_TYPES } from '../constants';

export const isManagedByMozilla = ({ CouponCode }: { CouponCode?: string | null } = {}) => {
    const coupon = CouponCode || ''; // CouponCode can be null
    return coupon.startsWith('MOZILLA') || coupon.startsWith('MOZTEST');
};

export const getSubscriptionPlans = ({ Plans = [] }) => Plans.filter(({ Type }) => Type === PLAN_TYPES.PLAN);

export const getSubscriptionTitle = ({ Plans = [] }) => {
    return getSubscriptionPlans({ Plans })
        .map(({ Title }) => Title)
        .join(', ');
};
