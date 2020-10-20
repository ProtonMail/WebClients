import { isWithinInterval } from 'date-fns';

import { BLACK_FRIDAY, PRODUCT_PAYER, COUPON_CODES } from '../constants';
import { Subscription } from '../interfaces';
import { hasMailPlus, hasMailProfessional, hasVpnBasic, hasVpnPlus } from './subscription';

export const isBlackFridayPeriod = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.START, end: BLACK_FRIDAY.END });
};

export const isCyberMonday = () => {
    return isWithinInterval(new Date(), { start: BLACK_FRIDAY.CYBER_START, end: BLACK_FRIDAY.CYBER_END });
};

export const isProductPayerPeriod = () => {
    return isWithinInterval(new Date(), { start: PRODUCT_PAYER.START, end: PRODUCT_PAYER.END });
};

export const isProductPayer = (subscription: Subscription) => {
    if (!subscription) {
        return false;
    }

    const couponCode = subscription?.CouponCode || '';
    const noBundle = ![COUPON_CODES.BUNDLE, BLACK_FRIDAY.COUPON_CODE].includes(couponCode);

    return (
        (hasMailPlus(subscription) || hasVpnBasic(subscription) || hasVpnPlus(subscription)) &&
        !hasMailProfessional(subscription) &&
        noBundle
    );
};
