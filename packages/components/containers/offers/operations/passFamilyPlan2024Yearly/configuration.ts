import { FeatureCode } from '@proton/features';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { COUPON_CODES } from '@proton/shared/lib/constants';

import Layout from '../../components/passFamilyPlan/Layout';
import type { OfferConfig } from '../../interface';

export const passFamilyPlan2024YearlyConfig = {
    ID: 'pass-family-plan-2024-yearly',
    featureCode: FeatureCode.OfferPassFamilyPlan2024Yearly,
    autoPopUp: 'each-time',
    deals: [
        {
            ref: 'pass_family_plus_399_webmodal',
            dealName: PLAN_NAMES[PLANS.PASS_FAMILY],
            planIDs: { [PLANS.PASS_FAMILY]: 1 },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.PASSFAMILYLAUNCH,
        },
        {
            ref: 'pass_family_1lt_299_webmodal',
            dealName: PLAN_NAMES[PLANS.PASS_FAMILY],
            planIDs: { [PLANS.PASS_FAMILY]: 1 },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.PASSEARLYSUPPORTER,
        },
    ],
    layout: Layout,
    canBeDisabled: true,
    hideDealTitle: true,
    hideDealPriceInfos: true,
    hideDiscountBubble: true,
    darkBackground: true,
} satisfies OfferConfig;
