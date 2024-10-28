import { COUPON_CODES } from '@proton/shared/lib/constants';
import { getHasCoupon } from '@proton/shared/lib/helpers/subscription';
import type { Subscription } from '@proton/shared/lib/interfaces';

const hasOneBF2024Coupon = (subscription?: Subscription) => {
    return (
        getHasCoupon(subscription, COUPON_CODES.BLACK_FRIDAY_2024) ||
        getHasCoupon(subscription, COUPON_CODES.BLACK_FRIDAY_2024_MONTH)
    );
};

export default hasOneBF2024Coupon;
