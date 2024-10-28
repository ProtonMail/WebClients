import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getDuoInboxFeatures, getFamilyInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-unlimited',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024Unlimited,
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
            ref: 'bf_24_unlimited-modal-duo_12',
            dealName: PLAN_NAMES[PLANS.DUO],
            planIDs: {
                [PLANS.DUO]: 1,
            },
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getDuoInboxFeatures,
            popular: 1,
            buttonSize: 'large',
            header: () => c('BF2024: Info').t`Most popular`,
        },
        {
            ref: 'bf_24_unlimited-modal-family_12',
            dealName: PLAN_NAMES[PLANS.FAMILY],
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            popular: 2,
            cycle: CYCLE.YEARLY,
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getFamilyInboxFeatures,
            buttonSize: 'large',
        },
    ],
    layout: Layout,
};

export default config;
