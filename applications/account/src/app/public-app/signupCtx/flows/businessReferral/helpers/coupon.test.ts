import { COUPON_CODES } from '@proton/payments/core/constants';

import { getBusinessReferralCoupon } from './coupon';

describe('getBusinessReferralCoupon', () => {
    it('defaults to the business referral coupon when there is a referrer', () => {
        expect(getBusinessReferralCoupon(new URLSearchParams('referrer=ABC123'))).toBe(
            COUPON_CODES.BUSINESS_REFERRAL_2026
        );
    });

    it('uses the coupon from the URL, uppercased, when there is a referrer', () => {
        expect(getBusinessReferralCoupon(new URLSearchParams('referrer=ABC123&coupon=mycoupon'))).toBe('MYCOUPON');
    });

    it('sends no coupon without a referrer, even if the URL has one', () => {
        expect(getBusinessReferralCoupon(new URLSearchParams(''))).toBeUndefined();
        expect(getBusinessReferralCoupon(new URLSearchParams('coupon=mycoupon'))).toBeUndefined();
    });
});
