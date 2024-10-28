import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments/index';
import { COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';

import { getFamilyInboxFeatures } from '../../helpers/offerCopies';
import type { OfferConfig } from '../../interface';
import Layout from './Layout';

const config: OfferConfig = {
    ID: 'black-friday-2024-duo',
    autoPopUp: 'one-time',
    featureCode: FeatureCode.OfferBlackFriday2024Duo,
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
            ref: 'bf_24_duo-modal-family_12',
            dealName: PLAN_NAMES[PLANS.FAMILY],
            planIDs: {
                [PLANS.FAMILY]: 1,
            },
            cycle: CYCLE.YEARLY,
            popular: 1,
            buttonSize: 'large',
            couponCode: COUPON_CODES.BLACK_FRIDAY_2024,
            features: getFamilyInboxFeatures,
        },
    ],
    layout: Layout,
};

export default config;
