import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getDuoInboxFeatures, getUnlimitedInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-plus',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024Plus,
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
            ref: 'bf_24_plus-modal-unlimited_12',
            dealName: PLAN_NAMES[PLANS.BUNDLE],
            planIDs: {
                [PLANS.BUNDLE]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getUnlimitedInboxFeatures,
            header: () => c('BF2024: Info').t`Most popular`,
        },
        {
            ref: 'bf_24_plus-modal-duo_12',
            dealName: PLAN_NAMES[PLANS.DUO],
            planIDs: {
                [PLANS.DUO]: 1,
            },
            cycle: CYCLE.YEARLY,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getDuoInboxFeatures,
        },
    ],
    layout: Layout,
};

export default config;
