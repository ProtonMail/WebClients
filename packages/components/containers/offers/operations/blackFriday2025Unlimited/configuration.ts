import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getDuoFeatures, getFamilyFeaturesforUnlimited } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025UnlimitedConfig: OfferConfig = {
    ID: 'black-friday-2025-unlimited',
    featureCode: FeatureCode.OfferBlackFriday2025Unlimited,
    canBeDisabled: true,
    topButton: {
        shape: 'ghost',
        variant: 'bf-2025-paid',
        icon: 'gift',
        iconSize: 4,
        gradient: false,
        // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.), keep translation as short as possible, like "Black Friday Offer"
        getCTAContent: () => c('BF2025: Action (top button in header)').t`Black Friday sale`,
    },
    subTitle: () =>
        c('BF2025: Offer subtitle')
            .t`Help your loved ones join the privacy revolution with our best-value bundles, now at 50% off!`,
    // hideDealPriceInfos: true,
    hideDiscountBubble: true,
    deals: [
        {
            ref: 'proton_bf_25_unlimited_web',
            dealName: PLAN_NAMES[PLANS.DUO],
            planIDs: {
                [PLANS.DUO]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025_BUNDLE,
            features: getDuoFeatures,
            star: '1',
        },
        {
            ref: 'proton_bf_25_unlimited_web',
            dealName: PLAN_NAMES[PLANS.FAMILY],
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025_BUNDLE,
            features: getFamilyFeaturesforUnlimited,
            star: '2',
        },
    ],
    layout: Layout,
};
