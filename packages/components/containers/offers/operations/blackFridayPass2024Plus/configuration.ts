import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getFamilyPassFeatures, getUnlimitedInboxFeaturesForPass } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-pass-plus',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024PassFree,
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
            ref: 'bf_24_pass-plus-family12',
            dealName: PLAN_NAMES[PLANS.PASS_FAMILY],
            planIDs: {
                [PLANS.PASS_FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            mobileOrder: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getFamilyPassFeatures,
            header: () => c('BF2024: Info').t`Most popular`,
        },
        {
            ref: 'bf_24_pass-free-unlimited12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            mobileOrder: 3,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getUnlimitedInboxFeaturesForPass,
        },
    ],
    layout: Layout,
};

export default config;
