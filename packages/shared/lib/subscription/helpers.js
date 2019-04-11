export const isManagedByMozilla = ({ CouponCode } = {}) => {
    const coupon = CouponCode || ''; // CouponCode can be null
    return coupon.startsWith('MOZILLA') || coupon.startsWith('MOZTEST');
};
