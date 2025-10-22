import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getUnlimitedInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025InboxPlusYearlyConfig: OfferConfig = {
    ID: 'black-friday-2025-inbox-plus-yearly',
    featureCode: FeatureCode.OfferBlackFriday2025InboxPlusYearly,
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
    hideDealPriceInfos: true,
    deals: [
        {
            ref: 'proton_bf_25_mail_12m_web',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025_BUNDLE,
            features: getUnlimitedInboxFeatures,
        },
    ],
    layout: Layout,
};
