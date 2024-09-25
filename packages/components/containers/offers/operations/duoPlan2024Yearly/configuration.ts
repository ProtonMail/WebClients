import { c } from 'ttag';

import { FeatureCode } from '@proton/features';
import { BRAND_NAME, CYCLE, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';

import Layout from '../../components/duoPlan/Layout';
import type { OfferConfig } from '../../interface';

const config = {
    ID: 'duo-plan-2024-yearly',
    featureCode: FeatureCode.OfferDuoPlanYearly2024,
    autoPopUp: 'one-time',
    deals: [
        {
            ref: 'upsell_mail-modal-duo_launch_1y',
            dealName: PLAN_NAMES[PLANS.DUO],
            planIDs: {
                [PLANS.DUO]: 1,
            },
            cycle: CYCLE.YEARLY,
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
