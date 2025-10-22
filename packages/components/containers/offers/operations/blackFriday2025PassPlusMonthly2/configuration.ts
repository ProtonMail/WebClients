import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getPassPlusFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025PassPlusMonthly2Config: OfferConfig = {
    ID: 'black-friday-2025-pass-plus-monthly2',
    featureCode: FeatureCode.OfferBlackFriday2025PassPlusMonthly2,
    canBeDisabled: true,
    topButton: {
        shape: 'ghost',
        variant: 'bf-2025-wave2',
        icon: 'bolt-filled',
        iconSize: 4,
        gradient: false,
        // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.), keep translation as short as possible, like "Black Friday Offer"
        getCTAContent: () => c('BF2025: Action (top button in header)').t`Black Friday sale`,
    },
    hideDealPriceInfos: true,
    deals: [
        {
            ref: 'proton_bf_25_pass_1m2_web',
            dealName: PLAN_NAMES[PLANS.PASS],
            planIDs: {
                [PLANS.PASS]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025,
            features: getPassPlusFeatures,
            sentenceSaveType: 'switch-yearly',
        },
    ],
    layout: Layout,
};
