import { COUPON_CODES } from '@proton/payments/core/constants';

import * as signupSearchParams from '../../../helpers/signupSearchParams';

// Referral coupons are whitelist-only and the whitelist entry needs a referrer: `/check` doesn't
// enforce it but subscribing does, so without one no coupon is sent rather than showing a
// discount that fails at payment.
export const getBusinessReferralCoupon = (searchParams: URLSearchParams) =>
    signupSearchParams.getReferralIdentifier(searchParams)
        ? (signupSearchParams.getCoupon(searchParams) ?? COUPON_CODES.BUSINESS_REFERRAL_2026)
        : undefined;
