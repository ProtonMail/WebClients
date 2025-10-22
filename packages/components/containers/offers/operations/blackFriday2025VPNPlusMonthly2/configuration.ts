import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';

import Layout from '../../components/blackFriday/Layout';
import { getVPNFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';

export const blackFriday2025VPNPlusMonthly2Config: OfferConfig = {
    ID: 'black-friday-2025-vpn-plus-monthly2',
    featureCode: FeatureCode.OfferBlackFriday2025VPNPlusMonthly2,
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
            ref: 'proton_bf_25_vpn_1m2_web',
            dealName: PLAN_NAMES[PLANS.VPN2024],
            planIDs: {
                [PLANS.VPN2024]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2025,
            features: getVPNFeatures,
            sentenceSaveType: 'switch-yearly',
        },
    ],
    layout: Layout,
};
