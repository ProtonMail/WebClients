import { type Subscription } from '@proton/payments';
import { getHas2024OfferCoupon } from '@proton/shared/lib/helpers/subscription';

const hasOneBF2024Coupon = (subscription?: Subscription) => {
    return (
        getHas2024OfferCoupon(subscription?.CouponCode) ||
        getHas2024OfferCoupon(subscription?.UpcomingSubscription?.CouponCode)
    );
};

export default hasOneBF2024Coupon;
