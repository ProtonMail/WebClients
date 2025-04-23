import { type Subscription, getHas2024OfferCoupon } from '@proton/payments';

const hasOneBF2024Coupon = (subscription?: Subscription) => {
    return (
        getHas2024OfferCoupon(subscription?.CouponCode) ||
        getHas2024OfferCoupon(subscription?.UpcomingSubscription?.CouponCode)
    );
};

export default hasOneBF2024Coupon;
