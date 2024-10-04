import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getVPNFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-vpn-monthly',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024VPNMonthly,
    topButton: {
        shape: 'ghost',
        variant: 'bf-2024',
        icon: 'percent',
        iconSize: 4,
        gradient: false,
        // translator: translate "Black Friday" only if it's problematic in your language (offensive/unknown/etc.)
        getCTAContent: () => c('BF2024: Action (top button in header)').t`Black Friday`,
    },
    canBeDisabled: true,
    darkBackground: true,
    deals: [
        {
            ref: 'bf_24_vpn_monthly-modal-vpn_12',
            dealName: PLAN_NAMES[PLANS.VPN2024],
            planIDs: {
                [PLANS.VPN2024]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getVPNFeatures,
        },
    ],
    layout: Layout,
};

export default config;
