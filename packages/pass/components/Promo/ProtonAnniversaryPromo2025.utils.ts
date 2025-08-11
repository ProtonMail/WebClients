import { c } from 'ttag';

import type { Feature } from '@proton/components/containers/offers/interface';
import { UpsellRef } from '@proton/pass/constants';
import type { MaybeNull } from '@proton/pass/types';
import { COUPON_CODES, PLANS } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

/** Plans eligible to Proton Anniversary 2025 promo */
export type EligiblePlan =
    | PLANS.FREE
    | PLANS.PASS
    | PLANS.MAIL
    | PLANS.VPN2024
    | PLANS.VPN_PASS_BUNDLE
    | PLANS.DRIVE
    | PLANS.BUNDLE
    | PLANS.DUO;

const upsellToUnlimited = {
    planToUpsell: PLANS.BUNDLE,
    coupon: COUPON_CODES.COMMUNITYSPECIALDEAL25,
    upsellRef: UpsellRef.PROTON_BDAY_25_BUNDLE_WEB,
    priceWithCoupon: 779,
    priceWithoutCoupon: 1299,
    features: () => [
        { name: c('anniversary_2025: Offer').t`500 GB encrypted storage` },
        { name: c('anniversary_2025: Offer').t`High speed streaming with VPN` },
        { name: c('anniversary_2025: Offer').t`Encrypted password manager` },
        { name: c('anniversary_2025: Offer').t`Secure email with unlimited aliases` },
    ],
};

/** Upsell:
 * - free users to Pass Plus
 * - Pass/Mail/VPN/Drive Plus to Unlimited
 * - Proton Unlimited to Proton Duo
 * - Proton Duo to Proton Family */
export const UPSELL_MAP: Record<
    EligiblePlan,
    {
        planToUpsell: PLANS;
        upsellRef: UpsellRef;
        coupon: COUPON_CODES;
        priceWithCoupon: number;
        priceWithoutCoupon: number;
        features: () => Feature[];
    }
> = {
    [PLANS.FREE]: {
        planToUpsell: PLANS.PASS,
        coupon: COUPON_CODES.PROTONBDAYSALEB25,
        upsellRef: UpsellRef.PROTON_BDAY_25_PASS_PLUS_WEB,
        priceWithCoupon: 249,
        priceWithoutCoupon: 499,
        features: () => [
            { name: c('anniversary_2025: Offer').t`Share passwords easily` },
            { name: c('anniversary_2025: Offer').t`Add unlimited credit cards` },
            { name: c('anniversary_2025: Offer').t`Save time with built-in 2FA` },
        ],
    },
    [PLANS.PASS]: upsellToUnlimited,
    [PLANS.MAIL]: upsellToUnlimited,
    [PLANS.VPN2024]: upsellToUnlimited,
    [PLANS.VPN_PASS_BUNDLE]: upsellToUnlimited,
    [PLANS.DRIVE]: upsellToUnlimited,
    [PLANS.BUNDLE]: {
        planToUpsell: PLANS.DUO,
        coupon: COUPON_CODES.COMMUNITYSPECIALDEAL25,
        upsellRef: UpsellRef.PROTON_BDAY_25_DUO_WEB,
        priceWithCoupon: 1199,
        priceWithoutCoupon: 1999,
        features: () => [
            { name: c('anniversary_2025: Offer').t`Online privacy for up to 2 people` },
            { name: c('anniversary_2025: Offer').t`Double your encrypted storage – get 1 TB for all your data` },
            {
                name: c('anniversary_2025: Offer')
                    .t`All premium features of ${BRAND_NAME} Mail, Pass, VPN, Drive, and Calendar`,
            },
        ],
    },
    [PLANS.DUO]: {
        planToUpsell: PLANS.FAMILY,
        coupon: COUPON_CODES.COMMUNITYSPECIALDEAL25,
        upsellRef: UpsellRef.PROTON_BDAY_25_FAMILY_WEB,
        priceWithCoupon: 1799,
        priceWithoutCoupon: 2999,
        features: () => [
            { name: c('anniversary_2025: Offer').t`Online privacy for your whole family (up to 6 users)` },
            { name: c('anniversary_2025: Offer').t`Triple your encrypted storage – get 3 TB for all your data` },
            {
                name: c('anniversary_2025: Offer')
                    .t`All premium features of ${BRAND_NAME} Mail, Pass, VPN, Drive, and Calendar`,
            },
        ],
    },
};

export const checkPlanEligible = (planName?: string): planName is EligiblePlan =>
    planName === PLANS.FREE ||
    planName === PLANS.PASS ||
    planName === PLANS.MAIL ||
    planName === PLANS.VPN2024 ||
    planName === PLANS.VPN_PASS_BUNDLE ||
    planName === PLANS.DRIVE ||
    planName === PLANS.BUNDLE ||
    planName === PLANS.DUO;

const OFFER_COUPONS = new Set<string>([
    COUPON_CODES.PROTONBDAYSALE25,
    COUPON_CODES.PROTONBDAYSALEB25,
    COUPON_CODES.COMMUNITYSPECIALDEAL25,
]);

export const alreadyBoughtOffer = (subscriptionCoupon?: MaybeNull<string>) =>
    OFFER_COUPONS.has(subscriptionCoupon ?? '');
