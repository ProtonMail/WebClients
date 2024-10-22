import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { BRAND_NAME, CYCLE } from '@proton/shared/lib/constants';

import Layout from '../../components/duoPlan/Layout';
import type { OfferConfig } from '../../interface';

const config = {
    ID: 'duo-plan-2024-two-years',
    featureCode: FeatureCode.OfferDuoPlanTwoYears2024,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'upsell_mail-modal-duo_launch_2y',
            dealName: PLAN_NAMES[PLANS.DUO],
            planIDs: {
                [PLANS.DUO]: 1,
            },
            cycle: CYCLE.TWO_YEARS,
            popular: 1, // to get solid CTA
            buttonSize: 'large',
        },
    ],
    layout: Layout,
    hideDealTitle: true,
    hideDealPriceInfos: true,
    hideDiscountBubble: true,
    darkBackground: true,
    topButton: {
        gradient: true,
        variant: 'pinkblue',
        iconGradient: false,
        getCTAContent: () => c('duoplan2024: Action').t`Get ${BRAND_NAME} Duo`,
        icon: 'users',
    },
} satisfies OfferConfig;

export default config;
