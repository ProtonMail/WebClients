import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getMailPlusInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025InboxFreeMonthlyConfig: OfferConfig = {
    ID: 'black-friday-2025-inbox-free-monthly',
    autoPopUp: 'one-time',
    canBeDisabled: true,
    featureCode: FeatureCode.OfferBlackFriday2025InboxFreeMonthly,
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
            ref: 'proton_bf_25_mail_free2_web',
            dealName: PLAN_NAMES[PLANS.MAIL],
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            cycle: CYCLE.MONTHLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025_MONTH,
            features: getMailPlusInboxFeatures,
            dealSuffixPrice: () => ' ', // to remove the suffix of the main price, as requested by design
        },
    ],
    layout: Layout,
};
