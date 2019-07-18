import { PLAN_TYPES } from '../constants';

const { PLAN } = PLAN_TYPES;

export const isManagedByMozilla = ({ CouponCode } = {}) => {
    const coupon = CouponCode || ''; // CouponCode can be null
    return coupon.startsWith('MOZILLA') || coupon.startsWith('MOZTEST');
};

export const getSubscriptionTitle = ({ Plans = [] }) => {
    return Plans.filter(({ Type }) => Type === PLAN)
        .map(({ Title }) => Title)
        .join(', ');
};
